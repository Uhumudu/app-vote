// src/pages/public/VoterPublicPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
  FiUsers, FiX, FiMinus, FiPlus,
} from "react-icons/fi";
import { BarChart3, Trophy } from "lucide-react";
import api from "../../services/api";

const API_BASE   = "http://localhost:5000";
const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

function buildPhotoUrl(photoUrl) {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http")) return photoUrl;
  return `${API_BASE}${photoUrl}`;
}

// ─── Avatar dans les modals ───────────────────────────────────────────────────
function Avatar({ photoUrl, prenom, nom, size = 52 }) {
  const [imgError, setImgError] = useState(false);
  const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
  const url = buildPhotoUrl(photoUrl);

  if (url && !imgError) {
    return (
      <div className="rounded-xl overflow-hidden flex-shrink-0 bg-indigo-100" style={{ width: size, height: size }}>
        <img src={url} alt={`${prenom} ${nom}`} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      </div>
    );
  }
  return (
    <div className="rounded-xl flex-shrink-0 bg-indigo-100 flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="text-indigo-600 font-semibold" style={{ fontSize: size * 0.3 }}>{initials}</span>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ src, nom, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .7, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()} className="relative"
        >
          <img src={src} alt={nom} className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain" />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-4">
            <p className="text-white font-bold text-center">{nom}</p>
          </div>
          <button onClick={onClose} className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors">
            <FiX size={16} className="text-gray-700" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Modal Paiement ───────────────────────────────────────────────────────────
function ModalPaiement({
  candidat, election, etape,
  nbVoix, setNbVoix,
  telephone, setTelephone,
  nomElecteur, setNomElecteur,
  emailElecteur, setEmailElecteur,
  campayRef, msgErreur,
  onPayer, onFermer, onReessayer, onConfirmerNbVoix,
}) {
  if (!["choix_voix", "saisie", "attente", "succes", "erreur"].includes(etape)) return null;

  const fraisUnitaire = election?.frais_vote_xaf || 100;
  const montantTotal  = fraisUnitaire * nbVoix;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}>
      <motion.div
        key={etape}
        initial={{ opacity: 0, scale: .92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: .92, y: 20 }} transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
      >
        <div className={`h-1.5 w-full ${
          etape === "succes" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
          etape === "erreur" ? "bg-gradient-to-r from-red-400 to-red-600" :
          "bg-gradient-to-r from-indigo-500 to-indigo-700"
        }`} />

        <div className="p-8">

          {/* ÉTAPE 1 — CHOIX VOIX */}
          {etape === "choix_voix" && (
            <>
              <div className="flex flex-col items-center mb-6">
                <Avatar photoUrl={candidat?.photo_url} prenom={candidat?.prenom} nom={candidat?.nom} size={80} />
                <h3 className="text-lg font-black text-gray-900 text-center mt-3">
                  Voter pour <span className="text-indigo-600">{candidat?.prenom} {candidat?.nom}</span>
                </h3>
                {candidat?.parti && (
                  <span className="mt-1 text-xs font-bold text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    {candidat.parti}
                  </span>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  Tarif : <strong className="text-indigo-600">{fraisUnitaire} XAF</strong> par voix
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
                  Combien de voix souhaitez-vous envoyer ?
                </label>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button onClick={() => setNbVoix(v => Math.max(1, v - 1))}
                    className="w-12 h-12 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors active:scale-95">
                    <FiMinus size={18} />
                  </button>
                  <div className="flex flex-col items-center">
                    <input type="number" min={1} max={100} value={nbVoix}
                      onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1 && v <= 100) setNbVoix(v); }}
                      className="w-24 text-center text-3xl font-black text-indigo-700 border-2 border-indigo-200 rounded-2xl py-3 px-2 outline-none focus:border-indigo-500 bg-indigo-50" />
                    <span className="text-xs text-gray-400 mt-1">voix</span>
                  </div>
                  <button onClick={() => setNbVoix(v => Math.min(100, v + 1))}
                    className="w-12 h-12 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors active:scale-95">
                    <FiPlus size={18} />
                  </button>
                </div>
                <div className="flex gap-2 justify-center flex-wrap mb-4">
                  {[1, 2, 3, 5, 10].map(n => (
                    <button key={n} onClick={() => setNbVoix(n)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${nbVoix === n ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 mb-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-indigo-600 font-medium">Prix unitaire</span>
                  <span className="text-sm font-bold text-indigo-700">{fraisUnitaire} XAF</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-indigo-600 font-medium">Nombre de voix</span>
                  <span className="text-sm font-bold text-indigo-700">× {nbVoix}</span>
                </div>
                <div className="h-px bg-indigo-200 my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-indigo-900">Total à payer</span>
                  <motion.span key={montantTotal} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-xl font-black text-indigo-700">
                    {montantTotal} XAF
                  </motion.span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onFermer} className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50">← Retour</button>
                <button onClick={onConfirmerNbVoix} className="flex-[2] py-3 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60 transition-all">
                  Continuer → {montantTotal} XAF
                </button>
              </div>
            </>
          )}

          {/* ÉTAPE 2 — SAISIE */}
          {etape === "saisie" && (
            <>
              <div className="flex flex-col items-center mb-5">
                <Avatar photoUrl={candidat?.photo_url} prenom={candidat?.prenom} nom={candidat?.nom} size={64} />
                <h3 className="text-base font-black text-gray-900 text-center mt-2">{candidat?.prenom} {candidat?.nom}</h3>
                {candidat?.parti && <span className="text-xs text-indigo-400 font-bold mt-0.5">{candidat.parti}</span>}
                <div className="flex items-center gap-2 mt-2 bg-indigo-50 rounded-xl px-4 py-2 border border-indigo-100">
                  <span className="text-xs text-indigo-500">{nbVoix} voix ×</span>
                  <span className="text-xs text-indigo-500">{fraisUnitaire} XAF =</span>
                  <span className="text-sm font-black text-indigo-700">{montantTotal} XAF</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Votre nom (optionnel)</label>
                <input type="text" placeholder="Ex: Kengne" value={nomElecteur} onChange={e => setNomElecteur(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <div className="mb-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email (optionnel)</label>
                <input type="email" placeholder="kengne@email.com" value={emailElecteur} onChange={e => setEmailElecteur(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <div className="mb-5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Numéro MTN / Orange Money *</label>
                <div className="flex border-2 border-indigo-100 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
                  <span className="px-4 py-3 bg-indigo-50 text-indigo-700 font-black text-sm border-r-2 border-indigo-100 whitespace-nowrap">+237</span>
                  <input type="tel" maxLength={9} placeholder="6XXXXXXXX" value={telephone}
                    onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))} autoFocus
                    className="flex-1 px-4 py-3 text-base font-mono text-gray-800 bg-transparent outline-none tracking-widest" />
                </div>
              </div>

              <div className="flex gap-2 mb-5">
                {[
                  { label:"MTN MoMo", color:"text-amber-700", bg:"bg-amber-50", border:"border-amber-200" },
                  { label:"Orange Money", color:"text-orange-700", bg:"bg-orange-50", border:"border-orange-200" },
                ].map(op => (
                  <div key={op.label} className={`flex-1 py-2 rounded-xl ${op.bg} border ${op.border} text-center text-xs font-bold ${op.color}`}>✓ {op.label}</div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setNomElecteur(""); setEmailElecteur(""); window.dispatchEvent(new CustomEvent("retour_choix_voix")); }}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50">← Retour</button>
                <button onClick={onPayer} disabled={telephone.length !== 9}
                  className={`flex-[2] py-3 rounded-xl font-black text-sm text-white transition-all ${telephone.length === 9 ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
                  💳 Payer {montantTotal} XAF
                </button>
              </div>
              <p className="text-center text-[11px] text-gray-400 mt-3">🔒 Paiement sécurisé via Mobile Money</p>
            </>
          )}

          {/* ATTENTE */}
          {etape === "attente" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mx-auto mb-5">
                <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">En attente de confirmation</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-3">
                Confirmez le paiement de <strong className="text-indigo-600">{montantTotal} XAF</strong> avec votre <strong className="text-indigo-600">PIN Mobile Money</strong>.
              </p>
              <div className="bg-indigo-50 rounded-xl p-3 mb-5 border border-indigo-100 text-sm text-indigo-700 font-medium">
                {nbVoix} voix × {fraisUnitaire} XAF = {montantTotal} XAF
              </div>
              {campayRef && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Référence</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{campayRef}</p>
                </div>
              )}
              <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {/* SUCCÈS */}
          {etape === "succes" && (
            <div className="text-center py-4">
              <motion.div initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type:"spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5">
                <FiCheckCircle size={36} className="text-emerald-500" />
              </motion.div>
              <h3 className="text-lg font-black text-emerald-700 mb-2">Vote enregistré !</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">
                Votre vote pour <strong className="text-gray-800">{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
              </p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm text-emerald-700 font-medium">
                🗳 {nbVoix} voix envoyée{nbVoix > 1 ? "s" : ""} · {montantTotal} XAF débité{nbVoix > 1 ? "s" : ""}
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <button onClick={onFermer} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">Voter à nouveau</button>
                <button onClick={() => window.location.href = "/dashboard-electeur"}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95">
                  Mon tableau de bord
                </button>
              </div>
            </div>
          )}

          {/* ERREUR */}
          {etape === "erreur" && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
                <FiXCircle size={36} className="text-red-500" />
              </div>
              <h3 className="text-lg font-black text-red-700 mb-2">Paiement échoué</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{msgErreur || "Le paiement a échoué ou le délai a expiré."}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={onFermer} className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">Fermer</button>
                <button onClick={onReessayer} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95">Réessayer</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Carte candidat — format poster vertical ──────────────────────────────────
function CarteCandidат({ c, idx, totalVotes, maxVotes, enCours, onVoter, onLightbox }) {
  const [imgError, setImgError] = useState(false);
  const votes    = Number(c.nb_votes);
  const pct      = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  const isLeader = votes > 0 && votes === maxVotes;
  const medals   = ["🥇", "🥈", "🥉"];
  const photoUrl = buildPhotoUrl(c.photo_url);
  const initials = `${c.prenom?.[0] ?? ""}${c.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
      className={`relative bg-white rounded-3xl overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col ${
        isLeader ? "ring-2 ring-indigo-400 shadow-indigo-100" : ""
      }`}
    >
      {/* ── PHOTO GRANDE ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 240 }}
      >
        {/* Image cliquable pour lightbox */}
        <div
          className="w-full h-full cursor-zoom-in"
          onClick={() => photoUrl && !imgError && onLightbox({ src: photoUrl, nom: `${c.prenom} ${c.nom}` })}
        >
          {photoUrl && !imgError ? (
            <img
              src={photoUrl}
              alt={`${c.prenom} ${c.nom}`}
              className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            /* Fallback initiales grand format */
            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
              <span className="text-7xl font-black text-indigo-300">{initials}</span>
            </div>
          )}
        </div>

        {/* Gradient sombre bas → texte lisible */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

        {/* Badge rang — haut gauche */}
        <div className={`absolute top-3 left-3 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-lg backdrop-blur-sm pointer-events-none ${
          idx === 0 ? "bg-amber-400/95 text-white" :
          idx === 1 ? "bg-gray-300/95 text-gray-700" :
          idx === 2 ? "bg-orange-400/95 text-white" :
          "bg-white/80 text-gray-500"
        }`}>
          {idx < 3 ? medals[idx] : `#${idx + 1}`}
        </div>

        {/* Badge "En tête" — haut droit */}
        {isLeader && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1.5 rounded-xl shadow pointer-events-none">
            <Trophy size={10} /> En tête
          </div>
        )}

        {/* ── NOM + PARTI en overlay bas (sur la photo) ── */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pointer-events-none">
          <p className="text-white font-black text-base leading-tight drop-shadow-lg truncate">
            {c.prenom} {c.nom}
          </p>
          {c.parti ? (
            <span className="inline-block mt-1 text-[11px] font-bold text-white/90 bg-white/20 backdrop-blur-sm border border-white/25 px-2.5 py-0.5 rounded-full">
              🏛 {c.parti}
            </span>
          ) : (
            <span className="inline-block mt-1 text-[11px] text-white/60 font-medium">
              Candidat indépendant
            </span>
          )}
        </div>
      </div>

      {/* ── BAS DE CARTE : votes + bio + bouton ── */}
      <div className="px-4 pt-3 pb-4 flex flex-col flex-1 gap-2">

        {/* Bio courte */}
        {c.bio && (
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{c.bio}</p>
        )}

        {/* Barre de votes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">
              <strong className="text-indigo-600">{votes}</strong> voix
            </span>
            {totalVotes > 0 && (
              <span className={`text-xs font-black ${isLeader ? "text-indigo-600" : "text-gray-300"}`}>
                {pct}%
              </span>
            )}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: idx * 0.07 + 0.2 }}
              className={`h-full rounded-full ${isLeader ? "bg-gradient-to-r from-indigo-500 to-indigo-400" : "bg-indigo-200"}`}
            />
          </div>
        </div>

        {/* Bouton voter */}
        {enCours && (
          <button
            onClick={() => onVoter(c)}
            className="mt-1 w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-indigo-200/60 flex items-center justify-center gap-2"
          >
            🗳 Voter
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function VoterPublicPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [errPage,      setErrPage]      = useState("");
  const [candidatSel,  setCandidatSel]  = useState(null);
  const [lightboxImg,  setLightboxImg]  = useState(null);

  const [etape,         setEtape]         = useState("");
  const [nbVoix,        setNbVoix]        = useState(1);
  const [telephone,     setTelephone]     = useState("");
  const [nomElecteur,   setNomElecteur]   = useState("");
  const [emailElecteur, setEmailElecteur] = useState("");
  const [campayRef,     setCampayRef]     = useState(null);
  const [msgErreur,     setMsgErreur]     = useState("");

  useEffect(() => {
    const handler = () => setEtape("choix_voix");
    window.addEventListener("retour_choix_voix", handler);
    return () => window.removeEventListener("retour_choix_voix", handler);
  }, []);

  useEffect(() => {
    api.get(`/public-elections/${id}/detail`)
      .then(r => setData(r.data))
      .catch(() => setErrPage("Élection introuvable ou non publique."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data?.election || data.election.statut !== "EN_COURS") return;
    const iv = setInterval(() => {
      api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, [data?.election?.statut]);

  const handleVoter = c => {
    setCandidatSel(c);
    setNbVoix(1);
    setTelephone("");
    setNomElecteur("");
    setEmailElecteur("");
    setCampayRef(null);
    setMsgErreur("");
    setEtape("choix_voix");
  };

  const handlePayer = async () => {
    if (!/^[0-9]{9}$/.test(telephone)) return;
    setEtape("attente");
    try {
      const { data: res } = await api.post(`/public-elections/${id}/voter`, {
        candidat_public_id: candidatSel.id,
        telephone:          `237${telephone}`,
        nb_voix:            nbVoix,
        nom_electeur:       nomElecteur   || undefined,
        email_electeur:     emailElecteur || undefined,
      });
      setCampayRef(res.campay_reference);
      lancerPolling(res.campay_reference);
    } catch (err) {
      setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
      setEtape("erreur");
    }
  };

  const lancerPolling = reference => {
    let tentatives = 0;
    const iv = setInterval(async () => {
      tentatives++;
      try {
        const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
        if (s.status === "SUCCESSFUL") {
          clearInterval(iv);
          setEtape("succes");
          api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
        } else if (s.status === "FAILED" || tentatives >= 24) {
          clearInterval(iv);
          setMsgErreur("Paiement échoué ou délai de 120 secondes dépassé.");
          setEtape("erreur");
        }
      } catch {
        clearInterval(iv);
        setMsgErreur("Erreur lors de la vérification.");
        setEtape("erreur");
      }
    }, 5000);
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
      </div>
    </div>
  );

  if (errPage) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex flex-col items-center justify-center gap-4">
      <span className="text-5xl">🗳</span>
      <p className="text-lg font-bold text-indigo-900">{errPage}</p>
      <button onClick={() => navigate("/")} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
        Retour à l'accueil
      </button>
    </div>
  );

  const { election, candidats } = data;
  const enCours    = election.statut === "EN_COURS";
  const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
  const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {lightboxImg && (
        <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
      )}

      <AnimatePresence>
        {etape && (
          <ModalPaiement
            candidat={candidatSel} election={election} etape={etape}
            nbVoix={nbVoix}           setNbVoix={setNbVoix}
            telephone={telephone}     setTelephone={setTelephone}
            nomElecteur={nomElecteur} setNomElecteur={setNomElecteur}
            emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
            campayRef={campayRef} msgErreur={msgErreur}
            onPayer={handlePayer}
            onConfirmerNbVoix={() => setEtape("saisie")}
            onFermer={() => { setEtape(""); setMsgErreur(""); }}
            onReessayer={() => { setEtape("choix_voix"); setMsgErreur(""); setTelephone(""); }}
          />
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg">
            <FiArrowLeft size={15} /> Retour
          </button>
          <div className="w-px h-5 bg-indigo-200" />
          <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
        </div>
        <a href="/dashboard-electeur"
          className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
          <BarChart3 size={14} /> Mon tableau de bord
        </a>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* EN-TÊTE ÉLECTION */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-700 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {enCours ? (
                  <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Élection en cours
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200">À venir</span>
                )}
                <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/30">🌐 Publique</span>
              </div>
              <h1 className="text-white text-xl font-black tracking-tight leading-tight">{election.titre}</h1>
              {election.description && <p className="text-indigo-300 text-xs mt-1.5 leading-relaxed">{election.description}</p>}
            </div>
            <div className="text-right">
              <p className="text-indigo-300 text-xs mb-0.5">Frais par voix</p>
              <p className="text-white text-2xl font-black">{election.frais_vote_xaf || 100} XAF</p>
              <p className="text-indigo-400 text-[11px]">par voix · MTN / Orange</p>
            </div>
          </div>

          <div className="flex mt-5 bg-white/10 rounded-xl overflow-hidden border border-white/15">
            {[
              { icon: <FiUsers size={13} />,  label: "Candidats",   value: candidats.length },
              { icon: <BarChart3 size={13} />, label: "Votes total", value: totalVotes },
              { icon: null,                   label: "Clôture",     value: formatDate(election.date_fin) },
            ].map((s, i) => (
              <div key={i} className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${i < 2 ? "border-r border-white/15" : ""}`}>
                {s.icon && <span className="text-indigo-300">{s.icon}</span>}
                <span className="text-white font-black text-base">{s.value}</span>
                <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CANDIDATS — grille poster */}
        <div className="mb-8">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-5 px-1 flex items-center gap-2">
            <FiUsers size={12} /> Candidats ({candidats.length})
          </p>

          {candidats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-indigo-100 p-12 text-center">
              <div className="text-4xl mb-3">🕐</div>
              <p className="font-bold text-gray-600">Aucun candidat approuvé pour l'instant</p>
            </div>
          ) : (
            // 2 colonnes mobile, 3 tablette, 4 desktop
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {candidats.map((c, idx) => (
                <CarteCandidат
                  key={c.id}
                  c={c}
                  idx={idx}
                  totalVotes={totalVotes}
                  maxVotes={maxVotes}
                  enCours={enCours}
                  onVoter={handleVoter}
                  onLightbox={setLightboxImg}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bandeau dashboard */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div>
            <p className="font-bold text-indigo-900 text-sm mb-0.5">📊 Suivez vos votes</p>
            <p className="text-xs text-gray-400">Consultez votre tableau de bord avec votre numéro de téléphone.</p>
          </div>
          <a href="/dashboard-electeur"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200/50 transition-all active:scale-95">
            Mon tableau de bord <FiArrowRight size={13} />
          </a>
        </div>

      </main>
    </div>
  );
}






























// // src/pages/public/VoterPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
//   FiUsers, FiX, FiZoomIn, FiMinus, FiPlus,
// } from "react-icons/fi";
// import { BarChart3, Trophy } from "lucide-react";
// import api from "../../services/api";

// const API_BASE   = "http://localhost:5000";
// const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// // ─── Utilitaire URL photo ─────────────────────────────────────────────────────
// function buildPhotoUrl(photoUrl) {
//   if (!photoUrl) return null;
//   if (photoUrl.startsWith("http")) return photoUrl;
//   return `${API_BASE}${photoUrl}`;
// }

// // ─── Avatar avec fallback initiales ──────────────────────────────────────────
// function Avatar({ photoUrl, prenom, nom, size = 52 }) {
//   const [imgError, setImgError] = useState(false);
//   const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
//   const url = buildPhotoUrl(photoUrl);

//   if (url && !imgError) {
//     return (
//       <div
//         className="rounded-xl overflow-hidden flex-shrink-0 bg-indigo-100"
//         style={{ width: size, height: size }}
//       >
//         <img
//           src={url}
//           alt={`${prenom} ${nom}`}
//           className="w-full h-full object-cover"
//           onError={() => setImgError(true)}
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       className="rounded-xl flex-shrink-0 bg-indigo-100 flex items-center justify-center"
//       style={{ width: size, height: size }}
//     >
//       <span className="text-indigo-600 font-semibold" style={{ fontSize: size * 0.3 }}>
//         {initials}
//       </span>
//     </div>
//   );
// }

// // ─── Photo candidat avec fallback + lightbox trigger ─────────────────────────
// function CandidatPhoto({ photoUrl, prenom, nom, onClickLightbox }) {
//   const [imgError, setImgError] = useState(false);
//   const url = buildPhotoUrl(photoUrl);
//   const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();

//   if (url && !imgError) {
//     return (
//       <div
//         className="relative cursor-pointer group"
//         onClick={() => onClickLightbox({ src: url, nom: `${prenom} ${nom}` })}
//       >
//         <img
//           src={url}
//           alt={`${prenom} ${nom}`}
//           className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100 group-hover:border-indigo-400 transition-all"
//           onError={() => setImgError(true)}
//         />
//         <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
//           <FiZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
//         </div>
//       </div>
//     );
//   }

//   // Fallback initiales
//   return (
//     <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl font-black">
//       {initials}
//     </div>
//   );
// }

// // ─── Lightbox photo ───────────────────────────────────────────────────────────
// function Lightbox({ src, nom, onClose }) {
//   useEffect(() => {
//     const handler = e => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [onClose]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="fixed inset-0 z-50 flex items-center justify-center p-6"
//         style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
//       >
//         <motion.div
//           initial={{ scale: .7, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: .7, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 300, damping: 25 }}
//           onClick={e => e.stopPropagation()}
//           className="relative"
//         >
//           <img
//             src={src}
//             alt={nom}
//             className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
//           />
//           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-4">
//             <p className="text-white font-bold text-center">{nom}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
//           >
//             <FiX size={16} className="text-gray-700" />
//           </button>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// // ─── Modal Paiement avec sélection du nombre de voix ─────────────────────────
// function ModalPaiement({
//   candidat, election, etape,
//   nbVoix, setNbVoix,
//   telephone, setTelephone,
//   nomElecteur, setNomElecteur,
//   emailElecteur, setEmailElecteur,
//   campayRef, msgErreur,
//   onPayer, onFermer, onReessayer,
//   onConfirmerNbVoix,
// }) {
//   if (!["choix_voix", "saisie", "attente", "succes", "erreur"].includes(etape)) return null;

//   const fraisUnitaire = election?.frais_vote_xaf || 100;
//   const montantTotal  = fraisUnitaire * nbVoix;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}
//     >
//       <motion.div
//         key={etape}
//         initial={{ opacity: 0, scale: .92, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: .92, y: 20 }}
//         transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
//         className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
//       >
//         {/* Bande top colorée */}
//         <div className={`h-1.5 w-full ${
//           etape === "succes" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
//           etape === "erreur" ? "bg-gradient-to-r from-red-400 to-red-600" :
//           "bg-gradient-to-r from-indigo-500 to-indigo-700"
//         }`} />

//         <div className="p-8">

//           {/* ── ÉTAPE 1 : CHOIX DU NOMBRE DE VOIX ── */}
//           {etape === "choix_voix" && (
//             <>
//               <div className="flex flex-col items-center mb-6">
//                 <Avatar
//                   photoUrl={candidat?.photo_url}
//                   prenom={candidat?.prenom}
//                   nom={candidat?.nom}
//                   size={80}
//                 />
//                 <h3 className="text-lg font-black text-gray-900 text-center mt-3">
//                   Voter pour{" "}
//                   <span className="text-indigo-600">{candidat?.prenom} {candidat?.nom}</span>
//                 </h3>
//                 <p className="text-sm text-gray-400 mt-1">
//                   Tarif : <strong className="text-indigo-600">{fraisUnitaire} XAF</strong> par voix
//                 </p>
//               </div>

//               {/* Sélecteur nombre de voix */}
//               <div className="mb-6">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
//                   Combien de voix souhaitez-vous envoyer ?
//                 </label>

//                 <div className="flex items-center justify-center gap-4 mb-4">
//                   <button
//                     onClick={() => setNbVoix(v => Math.max(1, v - 1))}
//                     className="w-12 h-12 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors active:scale-95 font-black text-xl"
//                   >
//                     <FiMinus size={18} />
//                   </button>

//                   <div className="flex flex-col items-center">
//                     <input
//                       type="number"
//                       min={1}
//                       max={100}
//                       value={nbVoix}
//                       onChange={e => {
//                         const v = parseInt(e.target.value, 10);
//                         if (!isNaN(v) && v >= 1 && v <= 100) setNbVoix(v);
//                       }}
//                       className="w-24 text-center text-3xl font-black text-indigo-700 border-2 border-indigo-200 rounded-2xl py-3 px-2 outline-none focus:border-indigo-500 transition-colors bg-indigo-50"
//                     />
//                     <span className="text-xs text-gray-400 mt-1">voix</span>
//                   </div>

//                   <button
//                     onClick={() => setNbVoix(v => Math.min(100, v + 1))}
//                     className="w-12 h-12 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors active:scale-95 font-black text-xl"
//                   >
//                     <FiPlus size={18} />
//                   </button>
//                 </div>

//                 {/* Raccourcis rapides */}
//                 <div className="flex gap-2 justify-center flex-wrap mb-4">
//                   {[1, 2, 3, 5, 10].map(n => (
//                     <button
//                       key={n}
//                       onClick={() => setNbVoix(n)}
//                       className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
//                         nbVoix === n
//                           ? "bg-indigo-600 text-white border-indigo-600"
//                           : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400"
//                       }`}
//                     >
//                       {n}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Récapitulatif montant */}
//               <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 mb-6 border border-indigo-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm text-indigo-600 font-medium">Prix unitaire</span>
//                   <span className="text-sm font-bold text-indigo-700">{fraisUnitaire} XAF</span>
//                 </div>
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm text-indigo-600 font-medium">Nombre de voix</span>
//                   <span className="text-sm font-bold text-indigo-700">× {nbVoix}</span>
//                 </div>
//                 <div className="h-px bg-indigo-200 my-2" />
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-black text-indigo-900">Total à payer</span>
//                   <motion.span
//                     key={montantTotal}
//                     initial={{ scale: 1.2, color: "#4f46e5" }}
//                     animate={{ scale: 1 }}
//                     className="text-xl font-black text-indigo-700"
//                   >
//                     {montantTotal} XAF
//                   </motion.span>
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={onFermer}
//                   className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   ← Retour
//                 </button>
//                 <button
//                   onClick={onConfirmerNbVoix}
//                   className="flex-[2] py-3 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60 transition-all"
//                 >
//                   Continuer → {montantTotal} XAF
//                 </button>
//               </div>
//             </>
//           )}

//           {/* ── ÉTAPE 2 : SAISIE TÉLÉPHONE ── */}
//           {etape === "saisie" && (
//             <>
//               <div className="flex flex-col items-center mb-5">
//                 <Avatar
//                   photoUrl={candidat?.photo_url}
//                   prenom={candidat?.prenom}
//                   nom={candidat?.nom}
//                   size={64}
//                 />
//                 <h3 className="text-base font-black text-gray-900 text-center mt-2">
//                   {candidat?.prenom} {candidat?.nom}
//                 </h3>
//                 {/* Récap compact */}
//                 <div className="flex items-center gap-2 mt-2 bg-indigo-50 rounded-xl px-4 py-2 border border-indigo-100">
//                   <span className="text-xs text-indigo-500">{nbVoix} voix ×</span>
//                   <span className="text-xs text-indigo-500">{fraisUnitaire} XAF =</span>
//                   <span className="text-sm font-black text-indigo-700">{montantTotal} XAF</span>
//                 </div>
//               </div>

//               {/* Nom */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Votre nom (optionnel)
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Ex: Kengne"
//                   value={nomElecteur}
//                   onChange={e => setNomElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Email */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Email (optionnel — confirmation)
//                 </label>
//                 <input
//                   type="email"
//                   placeholder="kengne@email.com"
//                   value={emailElecteur}
//                   onChange={e => setEmailElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Téléphone */}
//               <div className="mb-5">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Numéro MTN / Orange Money *
//                 </label>
//                 <div className="flex border-2 border-indigo-100 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
//                   <span className="px-4 py-3 bg-indigo-50 text-indigo-700 font-black text-sm border-r-2 border-indigo-100 whitespace-nowrap">
//                     +237
//                   </span>
//                   <input
//                     type="tel"
//                     maxLength={9}
//                     placeholder="6XXXXXXXX"
//                     value={telephone}
//                     onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
//                     autoFocus
//                     className="flex-1 px-4 py-3 text-base font-mono text-gray-800 bg-transparent outline-none tracking-widest"
//                   />
//                 </div>
//               </div>

//               {/* Opérateurs */}
//               <div className="flex gap-2 mb-5">
//                 {[
//                   { label:"MTN MoMo",     color:"text-amber-700",  bg:"bg-amber-50",  border:"border-amber-200" },
//                   { label:"Orange Money", color:"text-orange-700", bg:"bg-orange-50", border:"border-orange-200" },
//                 ].map(op => (
//                   <div key={op.label} className={`flex-1 py-2 rounded-xl ${op.bg} border ${op.border} text-center text-xs font-bold ${op.color}`}>
//                     ✓ {op.label}
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => { setNomElecteur(""); setEmailElecteur(""); window.dispatchEvent(new CustomEvent("retour_choix_voix")); }}
//                   className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   ← Retour
//                 </button>
//                 <button
//                   onClick={onPayer}
//                   disabled={telephone.length !== 9}
//                   className={`flex-[2] py-3 rounded-xl font-black text-sm text-white transition-all ${
//                     telephone.length === 9
//                       ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60"
//                       : "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   }`}
//                 >
//                   💳 Payer {montantTotal} XAF
//                 </button>
//               </div>
//               <p className="text-center text-[11px] text-gray-400 mt-3">🔒 Paiement sécurisé via Mobile Money</p>
//             </>
//           )}

//           {/* ── ATTENTE ── */}
//           {etape === "attente" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mx-auto mb-5">
//                 <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//               </div>
//               <h3 className="text-lg font-black text-gray-900 mb-2">En attente de confirmation</h3>
//               <p className="text-sm text-gray-400 leading-relaxed mb-3">
//                 Confirmez le paiement de{" "}
//                 <strong className="text-indigo-600">{montantTotal} XAF</strong>{" "}
//                 avec votre <strong className="text-indigo-600">PIN Mobile Money</strong>.
//               </p>
//               <div className="bg-indigo-50 rounded-xl p-3 mb-5 border border-indigo-100 text-sm text-indigo-700 font-medium">
//                 {nbVoix} voix × {fraisUnitaire} XAF = {montantTotal} XAF
//               </div>
//               {campayRef && (
//                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-left">
//                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Référence</p>
//                   <p className="text-xs text-gray-600 font-mono break-all">{campayRef}</p>
//                 </div>
//               )}
//               <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
//                 <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-pulse" />
//               </div>
//             </div>
//           )}

//           {/* ── SUCCÈS ── */}
//           {etape === "succes" && (
//             <div className="text-center py-4">
//               <motion.div
//                 initial={{ scale: .5, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ type:"spring", stiffness: 300, damping: 20 }}
//                 className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5"
//               >
//                 <FiCheckCircle size={36} className="text-emerald-500" />
//               </motion.div>
//               <h3 className="text-lg font-black text-emerald-700 mb-2">Vote enregistré !</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-3">
//                 Votre vote pour <strong className="text-gray-800">{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
//               </p>
//               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm text-emerald-700 font-medium">
//                 🗳 {nbVoix} voix envoyée{nbVoix > 1 ? "s" : ""} · {montantTotal} XAF débité{nbVoix > 1 ? "s" : ""}
//               </div>
//               <div className="flex gap-3 justify-center flex-wrap">
//                 <button
//                   onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   Voter à nouveau
//                 </button>
//                 <button
//                   onClick={() => window.location.href = "/dashboard-electeur"}
//                   className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95"
//                 >
//                   Mon tableau de bord
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── ERREUR ── */}
//           {etape === "erreur" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
//                 <FiXCircle size={36} className="text-red-500" />
//               </div>
//               <h3 className="text-lg font-black text-red-700 mb-2">Paiement échoué</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 {msgErreur || "Le paiement a échoué ou le délai a expiré."}
//               </p>
//               <div className="flex gap-3 justify-center">
//                 <button
//                   onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   Fermer
//                 </button>
//                 <button
//                   onClick={onReessayer}
//                   className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95"
//                 >
//                   Réessayer
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function VoterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [data,         setData]         = useState(null);
//   const [loading,      setLoading]      = useState(true);
//   const [errPage,      setErrPage]      = useState("");
//   const [candidatSel,  setCandidatSel]  = useState(null);
//   const [lightboxImg,  setLightboxImg]  = useState(null);

//   // Paiement
//   const [etape,         setEtape]         = useState("");
//   const [nbVoix,        setNbVoix]        = useState(1);
//   const [telephone,     setTelephone]     = useState("");
//   const [nomElecteur,   setNomElecteur]   = useState("");
//   const [emailElecteur, setEmailElecteur] = useState("");
//   const [campayRef,     setCampayRef]     = useState(null);
//   const [msgErreur,     setMsgErreur]     = useState("");

//   // Écouter l'événement "retour choix voix" depuis le bouton Retour de l'étape saisie
//   useEffect(() => {
//     const handler = () => setEtape("choix_voix");
//     window.addEventListener("retour_choix_voix", handler);
//     return () => window.removeEventListener("retour_choix_voix", handler);
//   }, []);

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setData(r.data))
//       .catch(() => setErrPage("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(() => {
//       api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//     }, 10000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut]);

//   // Ouvrir le modal à l'étape de choix du nombre de voix
//   const handleVoter = c => {
//     setCandidatSel(c);
//     setNbVoix(1);
//     setTelephone("");
//     setNomElecteur("");
//     setEmailElecteur("");
//     setCampayRef(null);
//     setMsgErreur("");
//     setEtape("choix_voix");
//   };

//   // Passer à l'étape de saisie téléphone après confirmation du nombre de voix
//   const handleConfirmerNbVoix = () => {
//     setEtape("saisie");
//   };

//   // Envoyer le paiement
//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) return;
//     setEtape("attente");
//     try {
//       const { data: res } = await api.post(`/public-elections/${id}/voter`, {
//         candidat_public_id: candidatSel.id,
//         telephone:          `237${telephone}`,
//         nb_voix:            nbVoix,
//         nom_electeur:       nomElecteur   || undefined,
//         email_electeur:     emailElecteur || undefined,
//       });
//       setCampayRef(res.campay_reference);
//       lancerPolling(res.campay_reference);
//     } catch (err) {
//       setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
//       setEtape("erreur");
//     }
//   };

//   const lancerPolling = reference => {
//     let tentatives = 0;
//     const iv = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
//         if (s.status === "SUCCESSFUL") {
//           clearInterval(iv);
//           setEtape("succes");
//           api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//         } else if (s.status === "FAILED" || tentatives >= 24) {
//           clearInterval(iv);
//           setMsgErreur("Paiement échoué ou délai de 120 secondes dépassé.");
//           setEtape("erreur");
//         }
//       } catch {
//         clearInterval(iv);
//         setMsgErreur("Erreur lors de la vérification.");
//         setEtape("erreur");
//       }
//     }, 5000);
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-3">
//         <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
//         <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
//       </div>
//     </div>
//   );

//   // ── Erreur page ────────────────────────────────────────────────────────────
//   if (errPage) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex flex-col items-center justify-center gap-4">
//       <span className="text-5xl">🗳</span>
//       <p className="text-lg font-bold text-indigo-900">{errPage}</p>
//       <button
//         onClick={() => navigate("/")}
//         className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
//       >
//         Retour à l'accueil
//       </button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const enCours    = election.statut === "EN_COURS";
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* Lightbox */}
//       {lightboxImg && (
//         <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
//       )}

//       {/* Modal paiement */}
//       <AnimatePresence>
//         {etape && (
//           <ModalPaiement
//             candidat={candidatSel}
//             election={election}
//             etape={etape}
//             nbVoix={nbVoix}           setNbVoix={setNbVoix}
//             telephone={telephone}     setTelephone={setTelephone}
//             nomElecteur={nomElecteur} setNomElecteur={setNomElecteur}
//             emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
//             campayRef={campayRef}
//             msgErreur={msgErreur}
//             onPayer={handlePayer}
//             onConfirmerNbVoix={handleConfirmerNbVoix}
//             onFermer={() => { setEtape(""); setMsgErreur(""); }}
//             onReessayer={() => { setEtape("choix_voix"); setMsgErreur(""); setTelephone(""); }}
//           />
//         )}
//       </AnimatePresence>

//       {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
//           >
//             <FiArrowLeft size={15} /> Retour
//           </button>
//           <div className="w-px h-5 bg-indigo-200" />
//           <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
//         </div>
//         <a
//           href="/dashboard-electeur"
//           className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
//         >
//           <BarChart3 size={14} /> Mon tableau de bord
//         </a>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ── EN-TÊTE ÉLECTION ────────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-indigo-700 rounded-2xl p-6 mb-6 shadow-lg"
//         >
//           <div className="flex items-start justify-between flex-wrap gap-4">
//             <div>
//               <div className="flex items-center gap-2 mb-2 flex-wrap">
//                 {enCours ? (
//                   <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                     Élection en cours
//                   </span>
//                 ) : (
//                   <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200">
//                     À venir
//                   </span>
//                 )}
//                 <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/30">
//                   🌐 Publique
//                 </span>
//               </div>
//               <h1 className="text-white text-xl font-black tracking-tight leading-tight">{election.titre}</h1>
//               {election.description && (
//                 <p className="text-indigo-300 text-xs mt-1.5 leading-relaxed">{election.description}</p>
//               )}
//             </div>
//             <div className="text-right">
//               <p className="text-indigo-300 text-xs mb-0.5">Frais par voix</p>
//               <p className="text-white text-2xl font-black">{election.frais_vote_xaf || 100} XAF</p>
//               <p className="text-indigo-400 text-[11px]">par voix · MTN / Orange</p>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="flex mt-5 bg-white/10 rounded-xl overflow-hidden border border-white/15">
//             {[
//               { icon: <FiUsers size={13} />,  label: "Candidats",   value: candidats.length },
//               { icon: <BarChart3 size={13} />, label: "Votes total", value: totalVotes },
//               { icon: null,                   label: "Clôture",     value: formatDate(election.date_fin) },
//             ].map((s, i) => (
//               <div
//                 key={i}
//                 className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${i < 2 ? "border-r border-white/15" : ""}`}
//               >
//                 {s.icon && <span className="text-indigo-300">{s.icon}</span>}
//                 <span className="text-white font-black text-base">{s.value}</span>
//                 <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
//               </div>
//             ))}
//           </div>
//         </motion.div>

//         {/* ── CANDIDATS ────────────────────────────────────────────────────── */}
//         <div className="mb-8">
//           <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
//             <FiUsers size={12} /> Candidats ({candidats.length})
//           </p>

//           {candidats.length === 0 ? (
//             <div className="bg-white rounded-2xl border border-indigo-100 p-12 text-center">
//               <div className="text-4xl mb-3">🕐</div>
//               <p className="font-bold text-gray-600">Aucun candidat approuvé pour l'instant</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {candidats.map((c, idx) => {
//                 const votes    = Number(c.nb_votes);
//                 const pct      = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
//                 const isLeader = votes > 0 && votes === maxVotes;
//                 const medals   = ["🥇","🥈","🥉"];

//                 return (
//                   <motion.div
//                     key={c.id}
//                     initial={{ opacity: 0, y: 16 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: idx * 0.06 }}
//                     className={`bg-white rounded-2xl border-2 p-5 transition-all duration-200 ${
//                       isLeader
//                         ? "border-indigo-400 shadow-md shadow-indigo-100"
//                         : "border-gray-100 hover:border-indigo-200 hover:shadow-sm"
//                     }`}
//                   >
//                     {/* Header carte candidat */}
//                     <div className="flex items-start gap-4 mb-4">
//                       {/* ✅ CORRECTION : utilisation du composant CandidatPhoto */}
//                       <div className="relative flex-shrink-0">
//                         <CandidatPhoto
//                           photoUrl={c.photo_url}
//                           prenom={c.prenom}
//                           nom={c.nom}
//                           onClickLightbox={setLightboxImg}
//                         />
//                         {/* Badge rang */}
//                         <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow ${
//                           idx === 0 ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"
//                         }`}>
//                           {idx < 3 ? medals[idx] : `#${idx+1}`}
//                         </div>
//                       </div>

//                       {/* Infos */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-1">
//                           <p className="font-black text-gray-900 text-sm leading-tight">
//                             {c.prenom} {c.nom}
//                           </p>
//                           {isLeader && (
//                             <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
//                               <Trophy size={9} /> En tête
//                             </span>
//                           )}
//                         </div>
//                         {c.bio && (
//                           <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{c.bio}</p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Barre de votes */}
//                     <div className="mb-4">
//                       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                         <motion.div
//                           initial={{ width: 0 }}
//                           animate={{ width: `${pct}%` }}
//                           transition={{ duration: .9, ease: "easeOut", delay: idx * 0.06 + 0.1 }}
//                           className={`h-full rounded-full ${isLeader ? "bg-indigo-500" : "bg-indigo-200"}`}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between mt-1.5">
//                         <p className="text-xs text-gray-400">
//                           <strong className="text-indigo-600">{votes}</strong>{" "}
//                           voix
//                         </p>
//                         {totalVotes > 0 && (
//                           <p className="text-xs text-gray-400 font-medium">{pct}%</p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Bouton voter */}
//                     {enCours && (
//                       <button
//                         onClick={() => handleVoter(c)}
//                         className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2"
//                       >
//                         🗳 Voter pour ce candidat
//                       </button>
//                     )}
//                   </motion.div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* ── Bandeau dashboard ────────────────────────────────────────────── */}
//         <div className="bg-white rounded-2xl border border-indigo-100 p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
//           <div>
//             <p className="font-bold text-indigo-900 text-sm mb-0.5">📊 Suivez vos votes</p>
//             <p className="text-xs text-gray-400">Consultez votre tableau de bord avec votre numéro de téléphone.</p>
//           </div>
//           <a
//             href="/dashboard-electeur"
//             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200/50 transition-all active:scale-95"
//           >
//             Mon tableau de bord <FiArrowRight size={13} />
//           </a>
//         </div>

//       </main>
//     </div>
//   );
// }









































// // src/pages/public/VoterPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
//   FiUsers, FiX, FiZoomIn, FiMinus, FiPlus,
// } from "react-icons/fi";
// import { BarChart3, Trophy } from "lucide-react";
// import api from "../../services/api";

// const API_BASE   = "http://localhost:5000";
// const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// // ─── Utilitaire URL photo ─────────────────────────────────────────────────────
// function buildPhotoUrl(photoUrl) {
//   if (!photoUrl) return null;
//   if (photoUrl.startsWith("http")) return photoUrl;
//   return `${API_BASE}${photoUrl}`;
// }

// // ─── Avatar avec fallback initiales ──────────────────────────────────────────
// function Avatar({ photoUrl, prenom, nom, size = 52 }) {
//   const [imgError, setImgError] = useState(false);
//   const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
//   const url = buildPhotoUrl(photoUrl);

//   if (url && !imgError) {
//     return (
//       <div
//         className="rounded-xl overflow-hidden flex-shrink-0 bg-indigo-100"
//         style={{ width: size, height: size }}
//       >
//         <img
//           src={url}
//           alt={`${prenom} ${nom}`}
//           className="w-full h-full object-cover"
//           onError={() => setImgError(true)}
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       className="rounded-xl flex-shrink-0 bg-indigo-100 flex items-center justify-center"
//       style={{ width: size, height: size }}
//     >
//       <span className="text-indigo-600 font-semibold" style={{ fontSize: size * 0.3 }}>
//         {initials}
//       </span>
//     </div>
//   );
// }

// // ─── Lightbox photo ───────────────────────────────────────────────────────────
// function Lightbox({ src, nom, onClose }) {
//   useEffect(() => {
//     const handler = e => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [onClose]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="fixed inset-0 z-50 flex items-center justify-center p-6"
//         style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
//       >
//         <motion.div
//           initial={{ scale: .7, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: .7, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 300, damping: 25 }}
//           onClick={e => e.stopPropagation()}
//           className="relative"
//         >
//           <img
//             src={src}
//             alt={nom}
//             className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
//           />
//           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-4">
//             <p className="text-white font-bold text-center">{nom}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
//           >
//             <FiX size={16} className="text-gray-700" />
//           </button>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// // ─── Modal Paiement avec sélection du nombre de voix ─────────────────────────
// function ModalPaiement({
//   candidat, election, etape,
//   nbVoix, setNbVoix,
//   telephone, setTelephone,
//   nomElecteur, setNomElecteur,
//   emailElecteur, setEmailElecteur,
//   campayRef, msgErreur,
//   onPayer, onFermer, onReessayer,
//   onConfirmerNbVoix,
// }) {
//   if (!["choix_voix", "saisie", "attente", "succes", "erreur"].includes(etape)) return null;

//   const fraisUnitaire = election?.frais_vote_xaf || 100;
//   const montantTotal  = fraisUnitaire * nbVoix;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}
//     >
//       <motion.div
//         key={etape}
//         initial={{ opacity: 0, scale: .92, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: .92, y: 20 }}
//         transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
//         className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
//       >
//         {/* Bande top colorée */}
//         <div className={`h-1.5 w-full ${
//           etape === "succes" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
//           etape === "erreur" ? "bg-gradient-to-r from-red-400 to-red-600" :
//           "bg-gradient-to-r from-indigo-500 to-indigo-700"
//         }`} />

//         <div className="p-8">

//           {/* ── ÉTAPE 1 : CHOIX DU NOMBRE DE VOIX ── */}
//           {etape === "choix_voix" && (
//             <>
//               <div className="flex flex-col items-center mb-6">
//                 <Avatar
//                   photoUrl={candidat?.photo_url}
//                   prenom={candidat?.prenom}
//                   nom={candidat?.nom}
//                   size={80}
//                 />
//                 <h3 className="text-lg font-black text-gray-900 text-center mt-3">
//                   Voter pour{" "}
//                   <span className="text-indigo-600">{candidat?.prenom} {candidat?.nom}</span>
//                 </h3>
//                 <p className="text-sm text-gray-400 mt-1">
//                   Tarif : <strong className="text-indigo-600">{fraisUnitaire} XAF</strong> par voix
//                 </p>
//               </div>

//               {/* Sélecteur nombre de voix */}
//               <div className="mb-6">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
//                   Combien de voix souhaitez-vous envoyer ?
//                 </label>

//                 <div className="flex items-center justify-center gap-4 mb-4">
//                   <button
//                     onClick={() => setNbVoix(v => Math.max(1, v - 1))}
//                     className="w-12 h-12 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors active:scale-95 font-black text-xl"
//                   >
//                     <FiMinus size={18} />
//                   </button>

//                   <div className="flex flex-col items-center">
//                     <input
//                       type="number"
//                       min={1}
//                       max={100}
//                       value={nbVoix}
//                       onChange={e => {
//                         const v = parseInt(e.target.value, 10);
//                         if (!isNaN(v) && v >= 1 && v <= 100) setNbVoix(v);
//                       }}
//                       className="w-24 text-center text-3xl font-black text-indigo-700 border-2 border-indigo-200 rounded-2xl py-3 px-2 outline-none focus:border-indigo-500 transition-colors bg-indigo-50"
//                     />
//                     <span className="text-xs text-gray-400 mt-1">voix</span>
//                   </div>

//                   <button
//                     onClick={() => setNbVoix(v => Math.min(100, v + 1))}
//                     className="w-12 h-12 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600 transition-colors active:scale-95 font-black text-xl"
//                   >
//                     <FiPlus size={18} />
//                   </button>
//                 </div>

//                 {/* Raccourcis rapides */}
//                 <div className="flex gap-2 justify-center flex-wrap mb-4">
//                   {[1, 2, 3, 5, 10].map(n => (
//                     <button
//                       key={n}
//                       onClick={() => setNbVoix(n)}
//                       className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
//                         nbVoix === n
//                           ? "bg-indigo-600 text-white border-indigo-600"
//                           : "bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400"
//                       }`}
//                     >
//                       {n}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Récapitulatif montant */}
//               <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 mb-6 border border-indigo-200">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm text-indigo-600 font-medium">Prix unitaire</span>
//                   <span className="text-sm font-bold text-indigo-700">{fraisUnitaire} XAF</span>
//                 </div>
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm text-indigo-600 font-medium">Nombre de voix</span>
//                   <span className="text-sm font-bold text-indigo-700">× {nbVoix}</span>
//                 </div>
//                 <div className="h-px bg-indigo-200 my-2" />
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-black text-indigo-900">Total à payer</span>
//                   <motion.span
//                     key={montantTotal}
//                     initial={{ scale: 1.2, color: "#4f46e5" }}
//                     animate={{ scale: 1 }}
//                     className="text-xl font-black text-indigo-700"
//                   >
//                     {montantTotal} XAF
//                   </motion.span>
//                 </div>
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={onFermer}
//                   className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   ← Retour
//                 </button>
//                 <button
//                   onClick={onConfirmerNbVoix}
//                   className="flex-[2] py-3 rounded-xl font-black text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60 transition-all"
//                 >
//                   Continuer → {montantTotal} XAF
//                 </button>
//               </div>
//             </>
//           )}

//           {/* ── ÉTAPE 2 : SAISIE TÉLÉPHONE ── */}
//           {etape === "saisie" && (
//             <>
//               <div className="flex flex-col items-center mb-5">
//                 <Avatar
//                   photoUrl={candidat?.photo_url}
//                   prenom={candidat?.prenom}
//                   nom={candidat?.nom}
//                   size={64}
//                 />
//                 <h3 className="text-base font-black text-gray-900 text-center mt-2">
//                   {candidat?.prenom} {candidat?.nom}
//                 </h3>
//                 {/* Récap compact */}
//                 <div className="flex items-center gap-2 mt-2 bg-indigo-50 rounded-xl px-4 py-2 border border-indigo-100">
//                   <span className="text-xs text-indigo-500">{nbVoix} voix ×</span>
//                   <span className="text-xs text-indigo-500">{fraisUnitaire} XAF =</span>
//                   <span className="text-sm font-black text-indigo-700">{montantTotal} XAF</span>
//                 </div>
//               </div>

//               {/* Nom */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Votre nom (optionnel)
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Ex: Kengne"
//                   value={nomElecteur}
//                   onChange={e => setNomElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Email */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Email (optionnel — confirmation)
//                 </label>
//                 <input
//                   type="email"
//                   placeholder="kengne@email.com"
//                   value={emailElecteur}
//                   onChange={e => setEmailElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Téléphone */}
//               <div className="mb-5">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Numéro MTN / Orange Money *
//                 </label>
//                 <div className="flex border-2 border-indigo-100 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
//                   <span className="px-4 py-3 bg-indigo-50 text-indigo-700 font-black text-sm border-r-2 border-indigo-100 whitespace-nowrap">
//                     +237
//                   </span>
//                   <input
//                     type="tel"
//                     maxLength={9}
//                     placeholder="6XXXXXXXX"
//                     value={telephone}
//                     onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
//                     autoFocus
//                     className="flex-1 px-4 py-3 text-base font-mono text-gray-800 bg-transparent outline-none tracking-widest"
//                   />
//                 </div>
//               </div>

//               {/* Opérateurs */}
//               <div className="flex gap-2 mb-5">
//                 {[
//                   { label:"MTN MoMo",     color:"text-amber-700",  bg:"bg-amber-50",  border:"border-amber-200" },
//                   { label:"Orange Money", color:"text-orange-700", bg:"bg-orange-50", border:"border-orange-200" },
//                 ].map(op => (
//                   <div key={op.label} className={`flex-1 py-2 rounded-xl ${op.bg} border ${op.border} text-center text-xs font-bold ${op.color}`}>
//                     ✓ {op.label}
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => { /* retour à l'étape de sélection */ setNomElecteur(""); setEmailElecteur(""); window.dispatchEvent(new CustomEvent("retour_choix_voix")); }}
//                   className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   ← Retour
//                 </button>
//                 <button
//                   onClick={onPayer}
//                   disabled={telephone.length !== 9}
//                   className={`flex-[2] py-3 rounded-xl font-black text-sm text-white transition-all ${
//                     telephone.length === 9
//                       ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60"
//                       : "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   }`}
//                 >
//                   💳 Payer {montantTotal} XAF
//                 </button>
//               </div>
//               <p className="text-center text-[11px] text-gray-400 mt-3">🔒 Paiement sécurisé via Mobile Money</p>
//             </>
//           )}

//           {/* ── ATTENTE ── */}
//           {etape === "attente" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mx-auto mb-5">
//                 <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//               </div>
//               <h3 className="text-lg font-black text-gray-900 mb-2">En attente de confirmation</h3>
//               <p className="text-sm text-gray-400 leading-relaxed mb-3">
//                 Confirmez le paiement de{" "}
//                 <strong className="text-indigo-600">{montantTotal} XAF</strong>{" "}
//                 avec votre <strong className="text-indigo-600">PIN Mobile Money</strong>.
//               </p>
//               <div className="bg-indigo-50 rounded-xl p-3 mb-5 border border-indigo-100 text-sm text-indigo-700 font-medium">
//                 {nbVoix} voix × {fraisUnitaire} XAF = {montantTotal} XAF
//               </div>
//               {campayRef && (
//                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-left">
//                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Référence</p>
//                   <p className="text-xs text-gray-600 font-mono break-all">{campayRef}</p>
//                 </div>
//               )}
//               <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
//                 <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-pulse" />
//               </div>
//             </div>
//           )}

//           {/* ── SUCCÈS ── */}
//           {etape === "succes" && (
//             <div className="text-center py-4">
//               <motion.div
//                 initial={{ scale: .5, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ type:"spring", stiffness: 300, damping: 20 }}
//                 className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5"
//               >
//                 <FiCheckCircle size={36} className="text-emerald-500" />
//               </motion.div>
//               <h3 className="text-lg font-black text-emerald-700 mb-2">Vote enregistré !</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-3">
//                 Votre vote pour <strong className="text-gray-800">{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
//               </p>
//               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm text-emerald-700 font-medium">
//                 🗳 {nbVoix} voix envoyée{nbVoix > 1 ? "s" : ""} · {montantTotal} XAF débité{nbVoix > 1 ? "s" : ""}
//               </div>
//               <div className="flex gap-3 justify-center flex-wrap">
//                 <button
//                   onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   Voter à nouveau
//                 </button>
//                 <button
//                   onClick={() => window.location.href = "/dashboard-electeur"}
//                   className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95"
//                 >
//                   Mon tableau de bord
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── ERREUR ── */}
//           {etape === "erreur" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
//                 <FiXCircle size={36} className="text-red-500" />
//               </div>
//               <h3 className="text-lg font-black text-red-700 mb-2">Paiement échoué</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 {msgErreur || "Le paiement a échoué ou le délai a expiré."}
//               </p>
//               <div className="flex gap-3 justify-center">
//                 <button
//                   onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   Fermer
//                 </button>
//                 <button
//                   onClick={onReessayer}
//                   className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95"
//                 >
//                   Réessayer
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function VoterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [data,         setData]         = useState(null);
//   const [loading,      setLoading]      = useState(true);
//   const [errPage,      setErrPage]      = useState("");
//   const [candidatSel,  setCandidatSel]  = useState(null);
//   const [lightboxImg,  setLightboxImg]  = useState(null);

//   // Paiement
//   const [etape,         setEtape]         = useState("");
//   const [nbVoix,        setNbVoix]        = useState(1);
//   const [telephone,     setTelephone]     = useState("");
//   const [nomElecteur,   setNomElecteur]   = useState("");
//   const [emailElecteur, setEmailElecteur] = useState("");
//   const [campayRef,     setCampayRef]     = useState(null);
//   const [msgErreur,     setMsgErreur]     = useState("");

//   // Écouter l'événement "retour choix voix" depuis le bouton Retour de l'étape saisie
//   useEffect(() => {
//     const handler = () => setEtape("choix_voix");
//     window.addEventListener("retour_choix_voix", handler);
//     return () => window.removeEventListener("retour_choix_voix", handler);
//   }, []);

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setData(r.data))
//       .catch(() => setErrPage("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(() => {
//       api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//     }, 10000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut]);

//   // Ouvrir le modal à l'étape de choix du nombre de voix
//   const handleVoter = c => {
//     setCandidatSel(c);
//     setNbVoix(1);
//     setTelephone("");
//     setNomElecteur("");
//     setEmailElecteur("");
//     setCampayRef(null);
//     setMsgErreur("");
//     setEtape("choix_voix");
//   };

//   // Passer à l'étape de saisie téléphone après confirmation du nombre de voix
//   const handleConfirmerNbVoix = () => {
//     setEtape("saisie");
//   };

//   // Envoyer le paiement — le backend reçoit nb_voix et calcule le montant total
//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) return;
//     setEtape("attente");
//     try {
//       const { data: res } = await api.post(`/public-elections/${id}/voter`, {
//         candidat_public_id: candidatSel.id,
//         telephone:          `237${telephone}`,
//         nb_voix:            nbVoix,
//         nom_electeur:       nomElecteur   || undefined,
//         email_electeur:     emailElecteur || undefined,
//       });
//       setCampayRef(res.campay_reference);
//       lancerPolling(res.campay_reference);
//     } catch (err) {
//       setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
//       setEtape("erreur");
//     }
//   };

//   const lancerPolling = reference => {
//     let tentatives = 0;
//     const iv = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
//         if (s.status === "SUCCESSFUL") {
//           clearInterval(iv);
//           setEtape("succes");
//           api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//         } else if (s.status === "FAILED" || tentatives >= 24) {
//           clearInterval(iv);
//           setMsgErreur("Paiement échoué ou délai de 120 secondes dépassé.");
//           setEtape("erreur");
//         }
//       } catch {
//         clearInterval(iv);
//         setMsgErreur("Erreur lors de la vérification.");
//         setEtape("erreur");
//       }
//     }, 5000);
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-3">
//         <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
//         <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
//       </div>
//     </div>
//   );

//   // ── Erreur page ────────────────────────────────────────────────────────────
//   if (errPage) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex flex-col items-center justify-center gap-4">
//       <span className="text-5xl">🗳</span>
//       <p className="text-lg font-bold text-indigo-900">{errPage}</p>
//       <button
//         onClick={() => navigate("/")}
//         className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
//       >
//         Retour à l'accueil
//       </button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const enCours    = election.statut === "EN_COURS";
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* Lightbox */}
//       {lightboxImg && (
//         <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
//       )}

//       {/* Modal paiement */}
//       <AnimatePresence>
//         {etape && (
//           <ModalPaiement
//             candidat={candidatSel}
//             election={election}
//             etape={etape}
//             nbVoix={nbVoix}           setNbVoix={setNbVoix}
//             telephone={telephone}     setTelephone={setTelephone}
//             nomElecteur={nomElecteur} setNomElecteur={setNomElecteur}
//             emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
//             campayRef={campayRef}
//             msgErreur={msgErreur}
//             onPayer={handlePayer}
//             onConfirmerNbVoix={handleConfirmerNbVoix}
//             onFermer={() => { setEtape(""); setMsgErreur(""); }}
//             onReessayer={() => { setEtape("choix_voix"); setMsgErreur(""); setTelephone(""); }}
//           />
//         )}
//       </AnimatePresence>

//       {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
//           >
//             <FiArrowLeft size={15} /> Retour
//           </button>
//           <div className="w-px h-5 bg-indigo-200" />
//           <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
//         </div>
//         <a
//           href="/dashboard-electeur"
//           className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
//         >
//           <BarChart3 size={14} /> Mon tableau de bord
//         </a>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ── EN-TÊTE ÉLECTION ────────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-indigo-700 rounded-2xl p-6 mb-6 shadow-lg"
//         >
//           <div className="flex items-start justify-between flex-wrap gap-4">
//             <div>
//               <div className="flex items-center gap-2 mb-2 flex-wrap">
//                 {enCours ? (
//                   <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                     Élection en cours
//                   </span>
//                 ) : (
//                   <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200">
//                     À venir
//                   </span>
//                 )}
//                 <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/30">
//                   🌐 Publique
//                 </span>
//               </div>
//               <h1 className="text-white text-xl font-black tracking-tight leading-tight">{election.titre}</h1>
//               {election.description && (
//                 <p className="text-indigo-300 text-xs mt-1.5 leading-relaxed">{election.description}</p>
//               )}
//             </div>
//             <div className="text-right">
//               <p className="text-indigo-300 text-xs mb-0.5">Frais par voix</p>
//               <p className="text-white text-2xl font-black">{election.frais_vote_xaf || 100} XAF</p>
//               <p className="text-indigo-400 text-[11px]">par voix · MTN / Orange</p>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="flex mt-5 bg-white/10 rounded-xl overflow-hidden border border-white/15">
//             {[
//               { icon: <FiUsers size={13} />,  label: "Candidats",   value: candidats.length },
//               { icon: <BarChart3 size={13} />, label: "Votes total", value: totalVotes },
//               { icon: null,                   label: "Clôture",     value: formatDate(election.date_fin) },
//             ].map((s, i) => (
//               <div
//                 key={i}
//                 className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${i < 2 ? "border-r border-white/15" : ""}`}
//               >
//                 {s.icon && <span className="text-indigo-300">{s.icon}</span>}
//                 <span className="text-white font-black text-base">{s.value}</span>
//                 <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
//               </div>
//             ))}
//           </div>
//         </motion.div>

//         {/* ── CANDIDATS ────────────────────────────────────────────────────── */}
//         <div className="mb-8">
//           <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
//             <FiUsers size={12} /> Candidats ({candidats.length})
//           </p>

//           {candidats.length === 0 ? (
//             <div className="bg-white rounded-2xl border border-indigo-100 p-12 text-center">
//               <div className="text-4xl mb-3">🕐</div>
//               <p className="font-bold text-gray-600">Aucun candidat approuvé pour l'instant</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {candidats.map((c, idx) => {
//                 const votes    = Number(c.nb_votes);
//                 const pct      = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
//                 const isLeader = votes > 0 && votes === maxVotes;
//                 const photoUrl = buildPhotoUrl(c.photo_url);
//                 const medals   = ["🥇","🥈","🥉"];

//                 return (
//                   <motion.div
//                     key={c.id}
//                     initial={{ opacity: 0, y: 16 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: idx * 0.06 }}
//                     className={`bg-white rounded-2xl border-2 p-5 transition-all duration-200 ${
//                       isLeader
//                         ? "border-indigo-400 shadow-md shadow-indigo-100"
//                         : "border-gray-100 hover:border-indigo-200 hover:shadow-sm"
//                     }`}
//                   >
//                     {/* Header carte candidat */}
//                     <div className="flex items-start gap-4 mb-4">
//                       {/* Photo cliquable */}
//                       <div className="relative flex-shrink-0">
//                         {photoUrl ? (
//                           <div
//                             className="relative cursor-pointer group"
//                             onClick={() => setLightboxImg({ src: photoUrl, nom: `${c.prenom} ${c.nom}` })}
//                           >
//                             <img
//                               src={photoUrl}
//                               alt={`${c.prenom} ${c.nom}`}
//                               className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100 group-hover:border-indigo-400 transition-all"
//                             />
//                             <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
//                               <FiZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl font-black">
//                             {c.prenom?.[0]?.toUpperCase()}{c.nom?.[0]?.toUpperCase()}
//                           </div>
//                         )}
//                         {/* Badge rang */}
//                         <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow ${
//                           idx === 0 ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"
//                         }`}>
//                           {idx < 3 ? medals[idx] : `#${idx+1}`}
//                         </div>
//                       </div>

//                       {/* Infos */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-1">
//                           <p className="font-black text-gray-900 text-sm leading-tight">
//                             {c.prenom} {c.nom}
//                           </p>
//                           {isLeader && (
//                             <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
//                               <Trophy size={9} /> En tête
//                             </span>
//                           )}
//                         </div>
//                         {c.bio && (
//                           <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{c.bio}</p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Barre de votes */}
//                     <div className="mb-4">
//                       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                         <motion.div
//                           initial={{ width: 0 }}
//                           animate={{ width: `${pct}%` }}
//                           transition={{ duration: .9, ease: "easeOut", delay: idx * 0.06 + 0.1 }}
//                           className={`h-full rounded-full ${isLeader ? "bg-indigo-500" : "bg-indigo-200"}`}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between mt-1.5">
//                         <p className="text-xs text-gray-400">
//                           <strong className="text-indigo-600">{votes}</strong>{" "}
//                           voix
//                         </p>
//                         {totalVotes > 0 && (
//                           <p className="text-xs text-gray-400 font-medium">{pct}%</p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Bouton voter */}
//                     {enCours && (
//                       <button
//                         onClick={() => handleVoter(c)}
//                         className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200/50 flex items-center justify-center gap-2"
//                       >
//                         🗳 Voter pour ce candidat
//                       </button>
//                     )}
//                   </motion.div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* ── Bandeau dashboard ────────────────────────────────────────────── */}
//         <div className="bg-white rounded-2xl border border-indigo-100 p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
//           <div>
//             <p className="font-bold text-indigo-900 text-sm mb-0.5">📊 Suivez vos votes</p>
//             <p className="text-xs text-gray-400">Consultez votre tableau de bord avec votre numéro de téléphone.</p>
//           </div>
//           <a
//             href="/dashboard-electeur"
//             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200/50 transition-all active:scale-95"
//           >
//             Mon tableau de bord <FiArrowRight size={13} />
//           </a>
//         </div>

//       </main>
//     </div>
//   );
// }
























// // src/pages/public/VoterPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
//   FiUsers, FiSmartphone, FiX,
// } from "react-icons/fi";
// import { BarChart3 } from "lucide-react";
// import api from "../../services/api";

// const API_BASE   = "http://localhost:5000";
// const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// // ─── Utilitaire URL photo ─────────────────────────────────────────────────────
// function buildPhotoUrl(photoUrl) {
//   if (!photoUrl) return null;
//   if (photoUrl.startsWith("http")) return photoUrl;
//   return `${API_BASE}${photoUrl}`;
// }

// // ─── Avatar avec fallback initiales ──────────────────────────────────────────
// function Avatar({ photoUrl, prenom, nom, size = 52 }) {
//   const [imgError, setImgError] = useState(false);
//   const initials = `${prenom?.[0] ?? ""}${nom?.[0] ?? ""}`.toUpperCase();
//   const url = buildPhotoUrl(photoUrl);

//   if (url && !imgError) {
//     return (
//       <div
//         className="rounded-xl overflow-hidden flex-shrink-0 bg-indigo-100"
//         style={{ width: size, height: size }}
//       >
//         <img
//           src={url}
//           alt={`${prenom} ${nom}`}
//           className="w-full h-full object-cover"
//           onError={() => setImgError(true)}
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       className="rounded-xl flex-shrink-0 bg-indigo-100 flex items-center justify-center"
//       style={{ width: size, height: size }}
//     >
//       <span className="text-indigo-600 font-semibold" style={{ fontSize: size * 0.3 }}>
//         {initials}
//       </span>
//     </div>
//   );
// }

// // ─── Lightbox photo ───────────────────────────────────────────────────────────
// function Lightbox({ src, nom, onClose }) {
//   useEffect(() => {
//     const handler = e => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [onClose]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="fixed inset-0 z-50 flex items-center justify-center p-6"
//         style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
//       >
//         <motion.div
//           initial={{ scale: .7, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: .7, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 300, damping: 25 }}
//           onClick={e => e.stopPropagation()}
//           className="relative"
//         >
//           <img
//             src={src}
//             alt={nom}
//             className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
//           />
//           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-4">
//             <p className="text-white font-bold text-center">{nom}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
//           >
//             <FiX size={16} className="text-gray-700" />
//           </button>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// // ─── Modal Paiement ───────────────────────────────────────────────────────────
// function ModalPaiement({
//   candidat, election, etape,
//   telephone, setTelephone,
//   nomElecteur, setNomElecteur,
//   emailElecteur, setEmailElecteur,
//   campayRef, msgErreur,
//   onPayer, onFermer, onReessayer,
// }) {
//   if (!["saisie", "attente", "succes", "erreur"].includes(etape)) return null;
//   const frais = election?.frais_vote_xaf || 100;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}
//     >
//       <motion.div
//         initial={{ opacity: 0, scale: .92, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: .92, y: 20 }}
//         transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
//         className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
//       >
//         {/* Bande top colorée */}
//         <div className={`h-1.5 w-full ${
//           etape === "succes" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
//           etape === "erreur" ? "bg-gradient-to-r from-red-400 to-red-600" :
//           "bg-gradient-to-r from-indigo-500 to-indigo-700"
//         }`} />

//         <div className="p-8">

//           {/* ── SAISIE ── */}
//           {etape === "saisie" && (
//             <>
//               <div className="flex flex-col items-center mb-6">
//                 <Avatar
//                   photoUrl={candidat?.photo_url}
//                   prenom={candidat?.prenom}
//                   nom={candidat?.nom}
//                   size={80}
//                 />
//                 <h3 className="text-lg font-black text-gray-900 text-center mt-3">
//                   Voter pour{" "}
//                   <span className="text-indigo-600">{candidat?.prenom} {candidat?.nom}</span>
//                 </h3>
//                 <p className="text-sm text-gray-400 mt-1">
//                   Frais : <strong className="text-indigo-600">{frais} XAF</strong> · Paiement Mobile Money
//                 </p>
//               </div>

//               {/* Nom */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Votre nom (optionnel)
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Ex: Kengne"
//                   value={nomElecteur}
//                   onChange={e => setNomElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Email */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Email (optionnel — confirmation)
//                 </label>
//                 <input
//                   type="email"
//                   placeholder="kengne@email.com"
//                   value={emailElecteur}
//                   onChange={e => setEmailElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Téléphone */}
//               <div className="mb-5">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Numéro MTN / Orange Money *
//                 </label>
//                 <div className="flex border-2 border-indigo-100 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
//                   <span className="px-4 py-3 bg-indigo-50 text-indigo-700 font-black text-sm border-r-2 border-indigo-100 whitespace-nowrap">
//                     +237
//                   </span>
//                   <input
//                     type="tel"
//                     maxLength={9}
//                     placeholder="6XXXXXXXX"
//                     value={telephone}
//                     onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
//                     autoFocus
//                     className="flex-1 px-4 py-3 text-base font-mono text-gray-800 bg-transparent outline-none tracking-widest"
//                   />
//                 </div>
//               </div>

//               {/* Opérateurs */}
//               <div className="flex gap-2 mb-6">
//                 {[
//                   { label:"MTN MoMo",     color:"text-amber-700",  bg:"bg-amber-50",  border:"border-amber-200" },
//                   { label:"Orange Money", color:"text-orange-700", bg:"bg-orange-50", border:"border-orange-200" },
//                 ].map(op => (
//                   <div key={op.label} className={`flex-1 py-2 rounded-xl ${op.bg} border ${op.border} text-center text-xs font-bold ${op.color}`}>
//                     ✓ {op.label}
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={onFermer}
//                   className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   ← Retour
//                 </button>
//                 <button
//                   onClick={onPayer}
//                   disabled={telephone.length !== 9}
//                   className={`flex-[2] py-3 rounded-xl font-black text-sm text-white transition-all ${
//                     telephone.length === 9
//                       ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60"
//                       : "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   }`}
//                 >
//                   💳 Voter — {frais} XAF
//                 </button>
//               </div>
//               <p className="text-center text-[11px] text-gray-400 mt-3">🔒 Paiement sécurisé via Mobile Money</p>
//             </>
//           )}

//           {/* ── ATTENTE ── */}
//           {etape === "attente" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mx-auto mb-5">
//                 <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//               </div>
//               <h3 className="text-lg font-black text-gray-900 mb-2">En attente de confirmation</h3>
//               <p className="text-sm text-gray-400 leading-relaxed mb-5">
//                 Confirmez le paiement avec votre <strong className="text-indigo-600">PIN Mobile Money</strong>.
//               </p>
//               {campayRef && (
//                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-left">
//                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Référence</p>
//                   <p className="text-xs text-gray-600 font-mono break-all">{campayRef}</p>
//                 </div>
//               )}
//               <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
//                 <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-pulse" />
//               </div>
//             </div>
//           )}

//           {/* ── SUCCÈS ── */}
//           {etape === "succes" && (
//             <div className="text-center py-4">
//               <motion.div
//                 initial={{ scale: .5, opacity: 0 }}
//                 animate={{ scale: 1, opacity: 1 }}
//                 transition={{ type:"spring", stiffness: 300, damping: 20 }}
//                 className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5"
//               >
//                 <FiCheckCircle size={36} className="text-emerald-500" />
//               </motion.div>
//               <h3 className="text-lg font-black text-emerald-700 mb-2">Vote enregistré !</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 Votre vote pour <strong className="text-gray-800">{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
//               </p>
//               <div className="flex gap-3 justify-center flex-wrap">
//                 <button
//                   onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   Voter à nouveau
//                 </button>
//                 <button
//                   onClick={() => window.location.href = "/dashboard-electeur"}
//                   className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95"
//                 >
//                   Mon tableau de bord
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── ERREUR ── */}
//           {etape === "erreur" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
//                 <FiXCircle size={36} className="text-red-500" />
//               </div>
//               <h3 className="text-lg font-black text-red-700 mb-2">Paiement échoué</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 {msgErreur || "Le paiement a échoué ou le délai a expiré."}
//               </p>
//               <div className="flex gap-3 justify-center">
//                 <button
//                   onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
//                 >
//                   Fermer
//                 </button>
//                 <button
//                   onClick={onReessayer}
//                   className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95"
//                 >
//                   Réessayer
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function VoterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [data,         setData]         = useState(null);
//   const [loading,      setLoading]      = useState(true);
//   const [errPage,      setErrPage]      = useState("");
//   const [candidatSel,  setCandidatSel]  = useState(null);
//   const [lightboxImg,  setLightboxImg]  = useState(null);

//   // Paiement
//   const [etape,         setEtape]         = useState("");
//   const [telephone,     setTelephone]     = useState("");
//   const [nomElecteur,   setNomElecteur]   = useState("");
//   const [emailElecteur, setEmailElecteur] = useState("");
//   const [campayRef,     setCampayRef]     = useState(null);
//   const [msgErreur,     setMsgErreur]     = useState("");

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setData(r.data))
//       .catch(() => setErrPage("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(() => {
//       api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//     }, 10000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut]);

//   const handleVoter = c => {
//     setCandidatSel(c);
//     setTelephone(""); setNomElecteur(""); setEmailElecteur("");
//     setEtape("saisie");
//   };

//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) return;
//     setEtape("attente");
//     try {
//       const { data: res } = await api.post(`/public-elections/${id}/voter`, {
//         candidat_public_id: candidatSel.id,
//         telephone:          `237${telephone}`,
//         nom_electeur:       nomElecteur   || undefined,
//         email_electeur:     emailElecteur || undefined,
//       });
//       setCampayRef(res.campay_reference);
//       lancerPolling(res.campay_reference);
//     } catch (err) {
//       setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
//       setEtape("erreur");
//     }
//   };

//   const lancerPolling = reference => {
//     let tentatives = 0;
//     const iv = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
//         if (s.status === "SUCCESSFUL") {
//           clearInterval(iv); setEtape("succes");
//           api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//         } else if (s.status === "FAILED" || tentatives >= 12) {
//           clearInterval(iv);
//           setMsgErreur("Paiement échoué ou délai de 60 secondes dépassé.");
//           setEtape("erreur");
//         }
//       } catch {
//         clearInterval(iv);
//         setMsgErreur("Erreur lors de la vérification.");
//         setEtape("erreur");
//       }
//     }, 5000);
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-3">
//         <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
//         <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
//       </div>
//     </div>
//   );

//   // ── Erreur page ────────────────────────────────────────────────────────────
//   if (errPage) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex flex-col items-center justify-center gap-4">
//       <span className="text-5xl">🗳</span>
//       <p className="text-lg font-bold text-indigo-900">{errPage}</p>
//       <button
//         onClick={() => navigate("/")}
//         className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
//       >
//         Retour à l'accueil
//       </button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const enCours    = election.statut === "EN_COURS";
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* Lightbox */}
//       {lightboxImg && (
//         <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
//       )}

//       {/* Modal paiement */}
//       <AnimatePresence>
//         {etape && (
//           <ModalPaiement
//             candidat={candidatSel}
//             election={election}
//             etape={etape}
//             telephone={telephone}       setTelephone={setTelephone}
//             nomElecteur={nomElecteur}   setNomElecteur={setNomElecteur}
//             emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
//             campayRef={campayRef}
//             msgErreur={msgErreur}
//             onPayer={handlePayer}
//             onFermer={() => setEtape("")}
//             onReessayer={() => { setEtape("saisie"); setMsgErreur(""); }}
//           />
//         )}
//       </AnimatePresence>

//       {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
//         <div className="flex items-center gap-3">
//           <button
//             onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
//           >
//             <FiArrowLeft size={15} /> Retour
//           </button>
//           <div className="w-px h-5 bg-indigo-200" />
//           <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
//         </div>
//         <a
//           href="/dashboard-electeur"
//           className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
//         >
//           <BarChart3 size={14} /> Mon tableau de bord
//         </a>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ── EN-TÊTE ÉLECTION ────────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-indigo-700 rounded-2xl p-6 mb-6 shadow-lg"
//         >
//           <div className="flex items-start justify-between flex-wrap gap-4">
//             <div>
//               <div className="flex items-center gap-2 mb-2 flex-wrap">
//                 {enCours ? (
//                   <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                     Élection en cours
//                   </span>
//                 ) : (
//                   <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200">
//                     À venir
//                   </span>
//                 )}
//                 <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/30">
//                   🌐 Publique
//                 </span>
//               </div>
//               <h1 className="text-white text-xl font-black tracking-tight leading-tight">{election.titre}</h1>
//               {election.description && (
//                 <p className="text-indigo-300 text-xs mt-1.5 leading-relaxed">{election.description}</p>
//               )}
//             </div>
//             <div className="text-right">
//               <p className="text-indigo-300 text-xs mb-0.5">Frais de vote</p>
//               <p className="text-white text-2xl font-black">{election.frais_vote_xaf || 100} XAF</p>
//               <p className="text-indigo-400 text-[11px]">par vote · MTN / Orange</p>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="flex mt-5 bg-white/10 rounded-xl overflow-hidden border border-white/15">
//             {[
//               { icon: <FiUsers size={13} />,  label: "Candidats",   value: candidats.length },
//               { icon: <BarChart3 size={13} />, label: "Votes total", value: totalVotes },
//               { icon: null,                   label: "Clôture",     value: formatDate(election.date_fin) },
//             ].map((s, i) => (
//               <div
//                 key={i}
//                 className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${i < 2 ? "border-r border-white/15" : ""}`}
//               >
//                 {s.icon && <span className="text-indigo-300">{s.icon}</span>}
//                 <span className="text-white font-black text-base">{s.value}</span>
//                 <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
//               </div>
//             ))}
//           </div>
//         </motion.div>

//         {/* ── CANDIDATS ────────────────────────────────────────────────────── */}
//         <div className="mb-8">
//           <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
//             <FiUsers size={12} /> Candidats ({candidats.length})
//           </p>

//           {candidats.length === 0 ? (
//             <div className="bg-white rounded-2xl border border-indigo-100 p-12 text-center">
//               <div className="text-4xl mb-3">🕐</div>
//               <p className="font-bold text-gray-600">Aucun candidat approuvé pour l'instant</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//               {candidats.map((c, idx) => {
//                 const votes    = Number(c.nb_votes);
//                 const pct      = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
//                 const isLeader = votes > 0 && votes === maxVotes;
//                 const photoUrl = buildPhotoUrl(c.photo_url);

//                 return (
//                   <motion.div
//                     key={c.id}
//                     initial={{ opacity: 0, y: 12 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: idx * 0.06 }}
//                     className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-indigo-200 transition-colors"
//                   >
//                     {/* Header carte */}
//                     <div className="flex items-center gap-4">
//                       {/* Avatar cliquable si photo */}
//                       <div
//                         className={photoUrl ? "cursor-pointer" : ""}
//                         onClick={() => {
//                           if (photoUrl) setLightboxImg({ src: photoUrl, nom: `${c.prenom} ${c.nom}` });
//                         }}
//                       >
//                         <Avatar
//                           photoUrl={c.photo_url}
//                           prenom={c.prenom}
//                           nom={c.nom}
//                           size={52}
//                         />
//                       </div>

//                       {/* Nom + badge */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-0.5">
//                           <p className="font-semibold text-gray-900 text-sm leading-tight">
//                             {c.prenom} {c.nom}
//                           </p>
//                           {isLeader && (
//                             <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
//                               En tête
//                             </span>
//                           )}
//                         </div>
//                         {c.bio && (
//                           <p className="text-xs text-gray-400 leading-relaxed line-clamp-1">{c.bio}</p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Séparateur */}
//                     <div className="h-px bg-gray-100" />

//                     {/* Barre de votes */}
//                     <div>
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="text-xs text-gray-400">
//                           <strong className="text-gray-700 font-medium">{votes}</strong>{" "}
//                           vote{votes !== 1 ? "s" : ""}
//                         </span>
//                         {totalVotes > 0 && (
//                           <span className="text-xs text-gray-400">{pct}%</span>
//                         )}
//                       </div>
//                       <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
//                         <motion.div
//                           initial={{ width: 0 }}
//                           animate={{ width: `${pct}%` }}
//                           transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.06 + 0.1 }}
//                           className="h-full bg-indigo-500 rounded-full"
//                         />
//                       </div>
//                     </div>

//                     {/* Bouton voter */}
//                     {enCours && (
//                       <button
//                         onClick={() => handleVoter(c)}
//                         className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-medium text-sm transition-all"
//                       >
//                         Voter pour ce candidat
//                       </button>
//                     )}
//                   </motion.div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* ── Bandeau dashboard ────────────────────────────────────────────── */}
//         <div className="bg-white rounded-2xl border border-indigo-100 p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
//           <div>
//             <p className="font-bold text-indigo-900 text-sm mb-0.5">📊 Suivez vos votes</p>
//             <p className="text-xs text-gray-400">Consultez votre tableau de bord avec votre numéro de téléphone.</p>
//           </div>
//           <a
//             href="/dashboard-electeur"
//             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200/50 transition-all active:scale-95"
//           >
//             Mon tableau de bord <FiArrowRight size={13} />
//           </a>
//         </div>

//       </main>
//     </div>
//   );
// }
































// // src/pages/public/VoterPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCheckCircle, FiXCircle, FiArrowLeft, FiArrowRight,
//   FiUsers, FiSmartphone, FiAlertCircle, FiX, FiZoomIn,
// } from "react-icons/fi";
// import { BarChart3, Trophy } from "lucide-react";
// import api from "../../services/api";

// const API_BASE   = "http://localhost:5000";
// const formatDate = d => new Date(d).toLocaleDateString("fr-FR", { day:"2-digit", month:"short", year:"numeric" });

// // ─── Lightbox photo ───────────────────────────────────────────────────────────
// function Lightbox({ src, nom, onClose }) {
//   useEffect(() => {
//     const handler = e => { if (e.key === "Escape") onClose(); };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, [onClose]);

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         onClick={onClose}
//         className="fixed inset-0 z-50 flex items-center justify-center p-6"
//         style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
//       >
//         <motion.div
//           initial={{ scale: .7, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: .7, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 300, damping: 25 }}
//           onClick={e => e.stopPropagation()}
//           className="relative"
//         >
//           <img
//             src={src}
//             alt={nom}
//             className="max-h-[80vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
//           />
//           <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-2xl p-4">
//             <p className="text-white font-bold text-center">{nom}</p>
//           </div>
//           <button
//             onClick={onClose}
//             className="absolute -top-3 -right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors"
//           >
//             <FiX size={16} className="text-gray-700" />
//           </button>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// // ─── Modal Paiement ───────────────────────────────────────────────────────────
// function ModalPaiement({ candidat, election, etape, telephone, setTelephone, nomElecteur, setNomElecteur, emailElecteur, setEmailElecteur, campayRef, msgErreur, onPayer, onFermer, onReessayer }) {
//   if (!["saisie", "attente", "succes", "erreur"].includes(etape)) return null;
//   const frais = election?.frais_vote_xaf || 100;
//   const photoUrl = candidat?.photo_url ? `${API_BASE}${candidat.photo_url}` : null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
//       style={{ background: "rgba(15,23,42,0.75)", backdropFilter: "blur(8px)" }}>
//       <motion.div
//         initial={{ opacity: 0, scale: .92, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: .92, y: 20 }}
//         transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
//         className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative"
//       >
//         {/* Bande top colorée */}
//         <div className={`h-1.5 w-full ${
//           etape === "succes" ? "bg-gradient-to-r from-emerald-400 to-emerald-600" :
//           etape === "erreur" ? "bg-gradient-to-r from-red-400 to-red-600" :
//           "bg-gradient-to-r from-indigo-500 to-indigo-700"
//         }`} />

//         <div className="p-8">

//           {/* ── SAISIE ── */}
//           {etape === "saisie" && (
//             <>
//               {/* Avatar candidat */}
//               <div className="flex flex-col items-center mb-6">
//                 {photoUrl ? (
//                   <img src={photoUrl} alt={`${candidat.prenom} ${candidat.nom}`}
//                     className="w-20 h-20 rounded-2xl object-cover border-4 border-indigo-100 shadow-lg mb-3" />
//                 ) : (
//                   <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center mb-3">
//                     <FiSmartphone size={28} className="text-indigo-500" />
//                   </div>
//                 )}
//                 <h3 className="text-lg font-black text-gray-900 text-center">
//                   Voter pour{" "}
//                   <span className="text-indigo-600">{candidat?.prenom} {candidat?.nom}</span>
//                 </h3>
//                 <p className="text-sm text-gray-400 mt-1">
//                   Frais : <strong className="text-indigo-600">{frais} XAF</strong> · Paiement Mobile Money
//                 </p>
//               </div>

//               {/* Nom */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Votre nom (optionnel)
//                 </label>
//                 <input type="text" placeholder="Ex: Kengne"
//                   value={nomElecteur} onChange={e => setNomElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Email */}
//               <div className="mb-4">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Email (optionnel — confirmation)
//                 </label>
//                 <input type="email" placeholder="kengne@email.com"
//                   value={emailElecteur} onChange={e => setEmailElecteur(e.target.value)}
//                   className="w-full px-4 py-3 border-2 border-indigo-100 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-indigo-400 transition-colors"
//                 />
//               </div>

//               {/* Téléphone */}
//               <div className="mb-5">
//                 <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
//                   Numéro MTN / Orange Money *
//                 </label>
//                 <div className="flex border-2 border-indigo-100 rounded-xl overflow-hidden focus-within:border-indigo-400 transition-colors">
//                   <span className="px-4 py-3 bg-indigo-50 text-indigo-700 font-black text-sm border-r-2 border-indigo-100 whitespace-nowrap">
//                     +237
//                   </span>
//                   <input type="tel" maxLength={9} placeholder="6XXXXXXXX"
//                     value={telephone}
//                     onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
//                     autoFocus
//                     className="flex-1 px-4 py-3 text-base font-mono text-gray-800 bg-transparent outline-none tracking-widest"
//                   />
//                 </div>
//               </div>

//               {/* Opérateurs */}
//               <div className="flex gap-2 mb-6">
//                 {[
//                   { label:"MTN MoMo",    color:"text-amber-700",  bg:"bg-amber-50",  border:"border-amber-200" },
//                   { label:"Orange Money",color:"text-orange-700", bg:"bg-orange-50", border:"border-orange-200" },
//                 ].map(op => (
//                   <div key={op.label} className={`flex-1 py-2 rounded-xl ${op.bg} border ${op.border} text-center text-xs font-bold ${op.color}`}>
//                     ✓ {op.label}
//                   </div>
//                 ))}
//               </div>

//               <div className="flex gap-3">
//                 <button onClick={onFermer}
//                   className="flex-1 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-500 font-semibold text-sm hover:bg-gray-50 transition-colors">
//                   ← Retour
//                 </button>
//                 <button onClick={onPayer}
//                   disabled={telephone.length !== 9}
//                   className={`flex-[2] py-3 rounded-xl font-black text-sm text-white transition-all ${
//                     telephone.length === 9
//                       ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60"
//                       : "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   }`}>
//                   💳 Voter — {frais} XAF
//                 </button>
//               </div>
//               <p className="text-center text-[11px] text-gray-400 mt-3">🔒 Paiement sécurisé via Mobile Money</p>
//             </>
//           )}

//           {/* ── ATTENTE ── */}
//           {etape === "attente" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-100 flex items-center justify-center mx-auto mb-5">
//                 <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
//               </div>
//               <h3 className="text-lg font-black text-gray-900 mb-2">En attente de confirmation</h3>
//               <p className="text-sm text-gray-400 leading-relaxed mb-5">
//                 Confirmez le paiement avec votre <strong className="text-indigo-600">PIN Mobile Money</strong>.
//               </p>
//               {campayRef && (
//                 <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5 text-left">
//                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Référence</p>
//                   <p className="text-xs text-gray-600 font-mono break-all">{campayRef}</p>
//                 </div>
//               )}
//               <div className="h-1.5 bg-indigo-100 rounded-full overflow-hidden">
//                 <div className="h-full w-1/2 bg-indigo-500 rounded-full animate-pulse" />
//               </div>
//             </div>
//           )}

//           {/* ── SUCCÈS ── */}
//           {etape === "succes" && (
//             <div className="text-center py-4">
//               <motion.div
//                 initial={{ scale:.5, opacity:0 }}
//                 animate={{ scale:1, opacity:1 }}
//                 transition={{ type:"spring", stiffness:300, damping:20 }}
//                 className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto mb-5"
//               >
//                 <FiCheckCircle size={36} className="text-emerald-500" />
//               </motion.div>
//               <h3 className="text-lg font-black text-emerald-700 mb-2">Vote enregistré !</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 Votre vote pour <strong className="text-gray-800">{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
//               </p>
//               <div className="flex gap-3 justify-center flex-wrap">
//                 <button onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
//                   Voter à nouveau
//                 </button>
//                 <button onClick={() => window.location.href = "/dashboard-electeur"}
//                   className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95">
//                   Mon tableau de bord
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* ── ERREUR ── */}
//           {etape === "erreur" && (
//             <div className="text-center py-4">
//               <div className="w-20 h-20 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center mx-auto mb-5">
//                 <FiXCircle size={36} className="text-red-500" />
//               </div>
//               <h3 className="text-lg font-black text-red-700 mb-2">Paiement échoué</h3>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">
//                 {msgErreur || "Le paiement a échoué ou le délai a expiré."}
//               </p>
//               <div className="flex gap-3 justify-center">
//                 <button onClick={onFermer}
//                   className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
//                   Fermer
//                 </button>
//                 <button onClick={onReessayer}
//                   className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95">
//                   Réessayer
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function VoterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [data,         setData]         = useState(null);
//   const [loading,      setLoading]      = useState(true);
//   const [errPage,      setErrPage]      = useState("");
//   const [candidatSel,  setCandidatSel]  = useState(null);
//   const [lightboxImg,  setLightboxImg]  = useState(null); // { src, nom }

//   // Paiement
//   const [etape,         setEtape]         = useState("");
//   const [telephone,     setTelephone]     = useState("");
//   const [nomElecteur,   setNomElecteur]   = useState("");
//   const [emailElecteur, setEmailElecteur] = useState("");
//   const [campayRef,     setCampayRef]     = useState(null);
//   const [msgErreur,     setMsgErreur]     = useState("");

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setData(r.data))
//       .catch(() => setErrPage("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(() => {
//       api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//     }, 10000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut]);

//   const handleVoter = c => {
//     setCandidatSel(c);
//     setTelephone(""); setNomElecteur(""); setEmailElecteur("");
//     setEtape("saisie");
//   };

//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) return;
//     setEtape("attente");
//     try {
//       const { data: res } = await api.post(`/public-elections/${id}/voter`, {
//         candidat_public_id: candidatSel.id,
//         telephone:          `237${telephone}`,
//         nom_electeur:       nomElecteur   || undefined,
//         email_electeur:     emailElecteur || undefined,
//       });
//       setCampayRef(res.campay_reference);
//       lancerPolling(res.campay_reference);
//     } catch (err) {
//       setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
//       setEtape("erreur");
//     }
//   };

//   const lancerPolling = reference => {
//     let tentatives = 0;
//     const iv = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
//         if (s.status === "SUCCESSFUL") {
//           clearInterval(iv); setEtape("succes");
//           api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//         } else if (s.status === "FAILED" || tentatives >= 12) {
//           clearInterval(iv);
//           setMsgErreur("Paiement échoué ou délai de 60 secondes dépassé.");
//           setEtape("erreur");
//         }
//       } catch {
//         clearInterval(iv);
//         setMsgErreur("Erreur lors de la vérification.");
//         setEtape("erreur");
//       }
//     }, 5000);
//   };

//   // ── Loading ────────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="flex flex-col items-center gap-3">
//         <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
//         <p className="text-indigo-400 text-sm font-medium">Chargement…</p>
//       </div>
//     </div>
//   );

//   // ── Erreur page ────────────────────────────────────────────────────────────
//   if (errPage) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex flex-col items-center justify-center gap-4">
//       <span className="text-5xl">🗳</span>
//       <p className="text-lg font-bold text-indigo-900">{errPage}</p>
//       <button onClick={() => navigate("/")}
//         className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
//         Retour à l'accueil
//       </button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const enCours    = election.statut === "EN_COURS";
//   const totalVotes = candidats.reduce((s, c) => s + Number(c.nb_votes), 0);
//   const maxVotes   = candidats.reduce((m, c) => Math.max(m, Number(c.nb_votes)), 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* Lightbox */}
//       {lightboxImg && (
//         <Lightbox src={lightboxImg.src} nom={lightboxImg.nom} onClose={() => setLightboxImg(null)} />
//       )}

//       {/* Modal paiement */}
//       <AnimatePresence>
//         {etape && (
//           <ModalPaiement
//             candidat={candidatSel} election={election}
//             etape={etape}
//             telephone={telephone}     setTelephone={setTelephone}
//             nomElecteur={nomElecteur} setNomElecteur={setNomElecteur}
//             emailElecteur={emailElecteur} setEmailElecteur={setEmailElecteur}
//             campayRef={campayRef} msgErreur={msgErreur}
//             onPayer={handlePayer}
//             onFermer={() => setEtape("")}
//             onReessayer={() => { setEtape("saisie"); setMsgErreur(""); }}
//           />
//         )}
//       </AnimatePresence>

//       {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
//         <div className="flex items-center gap-3">
//           <button onClick={() => navigate(-1)}
//             className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg">
//             <FiArrowLeft size={15} /> Retour
//           </button>
//           <div className="w-px h-5 bg-indigo-200" />
//           <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
//         </div>
//         <a href="/dashboard-electeur"
//           className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
//           <BarChart3 size={14} /> Mon tableau de bord
//         </a>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ── EN-TÊTE ÉLECTION ────────────────────────────────────────────── */}
//         <motion.div
//           initial={{ opacity:0, y:20 }}
//           animate={{ opacity:1, y:0 }}
//           className="bg-indigo-700 rounded-2xl p-6 mb-6 shadow-lg"
//         >
//           <div className="flex items-start justify-between flex-wrap gap-4">
//             <div>
//               <div className="flex items-center gap-2 mb-2 flex-wrap">
//                 {enCours ? (
//                   <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200">
//                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
//                     Élection en cours
//                   </span>
//                 ) : (
//                   <span className="bg-blue-100 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full border border-blue-200">
//                     À venir
//                   </span>
//                 )}
//                 <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/30">
//                   🌐 Publique
//                 </span>
//               </div>
//               <h1 className="text-white text-xl font-black tracking-tight leading-tight">{election.titre}</h1>
//               {election.description && (
//                 <p className="text-indigo-300 text-xs mt-1.5 leading-relaxed">{election.description}</p>
//               )}
//             </div>
//             <div className="text-right">
//               <p className="text-indigo-300 text-xs mb-0.5">Frais de vote</p>
//               <p className="text-white text-2xl font-black">{election.frais_vote_xaf || 100} XAF</p>
//               <p className="text-indigo-400 text-[11px]">par vote · MTN / Orange</p>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="flex mt-5 bg-white/10 rounded-xl overflow-hidden border border-white/15">
//             {[
//               { icon:<FiUsers size={13}/>,   label:"Candidats",   value:candidats.length },
//               { icon:<BarChart3 size={13}/>,  label:"Votes total", value:totalVotes },
//               { icon:null,                   label:"Clôture",     value:formatDate(election.date_fin) },
//             ].map((s, i) => (
//               <div key={i} className={`flex-1 py-3 px-4 flex flex-col items-center gap-1 ${i < 2 ? "border-r border-white/15" : ""}`}>
//                 {s.icon && <span className="text-indigo-300">{s.icon}</span>}
//                 <span className="text-white font-black text-base">{s.value}</span>
//                 <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
//               </div>
//             ))}
//           </div>
//         </motion.div>

//         {/* ── CANDIDATS ────────────────────────────────────────────────────── */}
//         <div className="mb-8">
//           <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
//             <FiUsers size={12} /> Candidats ({candidats.length})
//           </p>

//           {candidats.length === 0 ? (
//             <div className="bg-white rounded-2xl border border-indigo-100 p-12 text-center">
//               <div className="text-4xl mb-3">🕐</div>
//               <p className="font-bold text-gray-600">Aucun candidat approuvé pour l'instant</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//               {candidats.map((c, idx) => {
//                 const pct      = maxVotes > 0 ? Math.round((Number(c.nb_votes) / maxVotes) * 100) : 0;
//                 const isLeader = Number(c.nb_votes) > 0 && Number(c.nb_votes) === maxVotes;
//                 const photoUrl = c.photo_url ? `${API_BASE}${c.photo_url}` : null;
//                 const medals   = ["🥇","🥈","🥉"];

//                 return (
//                   <motion.div
//                     key={c.id}
//                     initial={{ opacity:0, y:16 }}
//                     animate={{ opacity:1, y:0 }}
//                     transition={{ delay: idx * .06 }}
//                     className={`bg-white rounded-2xl border-2 p-5 transition-all duration-200 ${
//                       isLeader
//                         ? "border-indigo-400 shadow-md shadow-indigo-100"
//                         : "border-gray-100 hover:border-indigo-200 hover:shadow-sm"
//                     }`}
//                   >
//                     {/* Header carte candidat */}
//                     <div className="flex items-start gap-4 mb-4">
//                       {/* Photo cliquable */}
//                       <div className="relative flex-shrink-0">
//                         {photoUrl ? (
//                           <div
//                             className="relative cursor-pointer group"
//                             onClick={() => setLightboxImg({ src: photoUrl, nom: `${c.prenom} ${c.nom}` })}
//                           >
//                             <img
//                               src={photoUrl}
//                               alt={`${c.prenom} ${c.nom}`}
//                               className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-100 group-hover:border-indigo-400 transition-all"
//                             />
//                             <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
//                               <FiZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl font-black">
//                             {c.prenom?.[0]?.toUpperCase()}{c.nom?.[0]?.toUpperCase()}
//                           </div>
//                         )}
//                         {/* Badge rang */}
//                         <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow ${
//                           idx === 0 ? "bg-amber-400 text-white" : "bg-gray-100 text-gray-500"
//                         }`}>
//                           {idx < 3 ? medals[idx] : `#${idx+1}`}
//                         </div>
//                       </div>

//                       {/* Infos */}
//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-center gap-2 flex-wrap mb-1">
//                           <p className="font-black text-gray-900 text-sm leading-tight">
//                             {c.prenom} {c.nom}
//                           </p>
//                           {isLeader && (
//                             <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
//                               <Trophy size={9} /> En tête
//                             </span>
//                           )}
//                         </div>
//                         {c.bio && (
//                           <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
//                             {c.bio}
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Barre de votes */}
//                     <div className="mb-4">
//                       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                         <motion.div
//                           initial={{ width:0 }}
//                           animate={{ width:`${pct}%` }}
//                           transition={{ duration:.9, ease:"easeOut", delay: idx * .06 + .1 }}
//                           className={`h-full rounded-full ${isLeader ? "bg-indigo-500" : "bg-indigo-200"}`}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between mt-1.5">
//                         <p className="text-xs text-gray-400">
//                           <strong className="text-indigo-600">{c.nb_votes}</strong>{" "}
//                           vote{Number(c.nb_votes) > 1 ? "s" : ""}
//                         </p>
//                         {totalVotes > 0 && (
//                           <p className="text-xs text-gray-400 font-medium">
//                             {Math.round((Number(c.nb_votes) / totalVotes) * 100)}%
//                           </p>
//                         )}
//                       </div>
//                     </div>

//                     {/* Bouton voter */}
//                     {enCours && (
//                       <button
//                         onClick={() => handleVoter(c)}
//                         className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-indigo-200/50"
//                       >
//                         Voter pour ce candidat
//                       </button>
//                     )}
//                   </motion.div>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* ── Bandeau dashboard ────────────────────────────────────────────── */}
//         <div className="bg-white rounded-2xl border border-indigo-100 p-5 flex items-center justify-between gap-4 flex-wrap shadow-sm">
//           <div>
//             <p className="font-bold text-indigo-900 text-sm mb-0.5">📊 Suivez vos votes</p>
//             <p className="text-xs text-gray-400">Consultez votre tableau de bord avec votre numéro de téléphone.</p>
//           </div>
//           <a href="/dashboard-electeur"
//             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200/50 transition-all active:scale-95">
//             Mon tableau de bord <FiArrowRight size={13} />
//           </a>
//         </div>

//       </main>
//     </div>
//   );
// }










































// // src/pages/public/VoterPublicPage.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCheckCircle, FiXCircle, FiLoader, FiSmartphone,
//   FiArrowLeft, FiArrowRight, FiUsers,
// } from "react-icons/fi";
// import { BarChart3 } from "lucide-react";
// import api from "../../services/api";

// // ─── Helpers ─────────────────────────────────────────────────────────────────
// const formatDate = d =>
//   new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// // ─── Modal Paiement CamPay ────────────────────────────────────────────────────
// function ModalPaiement({ candidat, election, etape, telephone, setTelephone, nomElecteur, setNomElecteur, emailElecteur, setEmailElecteur, campayRef, msgErreur, onPayer, onFermer, onReessayer }) {
//   if (!["saisie", "attente", "succes", "erreur"].includes(etape)) return null;

//   const frais = election?.frais_vote_xaf || 10;

//   return (
//     <div style={{
//       position: "fixed", inset: 0,
//       background: "rgba(15,23,42,0.72)",
//       backdropFilter: "blur(8px)",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       zIndex: 2000, padding: 16,
//     }}>
//       <motion.div
//         initial={{ opacity: 0, scale: .92, y: 20 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         exit={{ opacity: 0, scale: .92, y: 20 }}
//         transition={{ duration: .3, ease: [0.22,1,0.36,1] }}
//         style={{
//           background: "#fff", borderRadius: 24,
//           padding: "40px 36px", width: "100%", maxWidth: 440,
//           boxShadow: "0 32px 100px rgba(0,0,0,0.28)",
//           position: "relative", overflow: "hidden",
//         }}
//       >
//         {/* Bande top */}
//         <div style={{
//           position: "absolute", top: 0, left: 0, right: 0, height: 5,
//           background:
//             etape === "succes" ? "linear-gradient(90deg,#22c55e,#16a34a)" :
//             etape === "erreur" ? "linear-gradient(90deg,#ef4444,#dc2626)" :
//             "linear-gradient(90deg,#6366f1,#4f46e5,#818cf8)",
//         }} />

//         {/* ── SAISIE ── */}
//         {etape === "saisie" && (
//           <>
//             <div style={{ textAlign: "center", marginBottom: 24 }}>
//               <div style={{
//                 width: 68, height: 68, borderRadius: 20,
//                 background: "linear-gradient(135deg,#6366f1,#4f46e5)",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 margin: "0 auto 16px",
//                 boxShadow: "0 10px 30px rgba(99,102,241,0.40)",
//               }}>
//                 <FiSmartphone size={28} color="white" />
//               </div>
//               <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginBottom: 8 }}>
//                 Voter pour <span style={{ color: "#6366f1" }}>{candidat?.prenom} {candidat?.nom}</span>
//               </h3>
//               <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
//                 Frais de vote : <strong style={{ color: "#6366f1", fontSize: 15 }}>{frais} XAF</strong>
//                 <br />Paiement sécurisé via Mobile Money
//               </p>
//             </div>

//             {/* Nom électeur */}
//             <div style={{ marginBottom: 14 }}>
//               <label style={LABEL_STYLE}>Votre nom (optionnel)</label>
//               <input
//                 type="text" placeholder="kengne"
//                 value={nomElecteur} onChange={e => setNomElecteur(e.target.value)}
//                 style={{ ...INPUT_STYLE, marginTop: 6 }}
//               />
//             </div>

//             {/* Email pour confirmation */}
//             <div style={{ marginBottom: 14 }}>
//               <label style={LABEL_STYLE}>Email (optionnel — pour recevoir la confirmation)</label>
//               <input
//                 type="email" placeholder="kengne@email.com"
//                 value={emailElecteur} onChange={e => setEmailElecteur(e.target.value)}
//                 style={{ ...INPUT_STYLE, marginTop: 6 }}
//               />
//             </div>

//             {/* Téléphone */}
//             <div style={{ marginBottom: 20 }}>
//               <label style={LABEL_STYLE}>Votre numéro MTN / Orange Money *</label>
//               <div style={{
//                 display: "flex", border: "2px solid #e0e7ff",
//                 borderRadius: 14, overflow: "hidden", marginTop: 6,
//               }}>
//                 <span style={{
//                   padding: "13px 16px", background: "#eef2ff", color: "#6366f1",
//                   fontWeight: 800, fontSize: 15, borderRight: "2px solid #e0e7ff",
//                   whiteSpace: "nowrap", letterSpacing: .5,
//                 }}>
//                   +237
//                 </span>
//                 <input
//                   type="tel" maxLength={9} placeholder="6XXXXXXXX"
//                   value={telephone} onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
//                   autoFocus
//                   style={{
//                     flex: 1, border: "none", outline: "none",
//                     padding: "13px 16px", fontSize: 16,
//                     fontFamily: "Outfit, sans-serif", color: "#1e293b",
//                     background: "transparent", letterSpacing: 2,
//                   }}
//                 />
//               </div>
//             </div>

//             {/* Opérateurs */}
//             <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
//               {[{ label: "MTN MoMo", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
//                 { label: "Orange Money", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" }].map(op => (
//                 <div key={op.label} style={{
//                   flex: 1, padding: "9px 10px", borderRadius: 10,
//                   background: op.bg, border: `1.5px solid ${op.border}`,
//                   textAlign: "center", fontSize: 12, fontWeight: 700, color: op.color,
//                 }}>
//                   ✓ {op.label}
//                 </div>
//               ))}
//             </div>

//             <div style={{ display: "flex", gap: 10 }}>
//               <button onClick={onFermer} style={BTN_OUTLINE}>← Retour</button>
//               <button
//                 onClick={onPayer}
//                 disabled={telephone.length !== 9}
//                 style={{
//                   ...BTN_FILLED,
//                   background: telephone.length === 9 ? "linear-gradient(135deg,#6366f1,#4f46e5)" : "#e2e8f0",
//                   color: telephone.length === 9 ? "#fff" : "#94a3b8",
//                   cursor: telephone.length === 9 ? "pointer" : "not-allowed",
//                   boxShadow: telephone.length === 9 ? "0 6px 18px rgba(99,102,241,0.40)" : "none",
//                 }}
//               >
//                 💳 Voter — {frais} XAF
//               </button>
//             </div>
//             <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
//                Paiement sécurisé via MOBILE
//             </p>
//           </>
//         )}

//         {/* ── ATTENTE ── */}
//         {etape === "attente" && (
//           <div style={{ textAlign: "center", padding: "12px 0" }}>
//             <div style={{
//               width: 80, height: 80, borderRadius: "50%",
//               background: "#eef2ff", border: "3px solid #c7d2fe",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               margin: "0 auto 22px",
//             }}>
//               <FiLoader size={34} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
//             </div>
//             <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginBottom: 12 }}>
//               En attente de confirmation
//             </h3>
//             <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
//               Confirmez le paiement avec votre <strong style={{ color: "#6366f1" }}>PIN Mobile Money</strong>.
//             </p>
//             {campayRef && (
//               <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0", marginBottom: 20, wordBreak: "break-all" }}>
//                 <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, margin: "0 0 4px" }}>Référence</p>
//                 <p style={{ fontSize: 12, color: "#475569", fontWeight: 600, margin: 0 }}>{campayRef}</p>
//               </div>
//             )}
//             <div style={{ height: 5, background: "#e0e7ff", borderRadius: 4, overflow: "hidden" }}>
//               <div style={{
//                 height: "100%", width: "45%",
//                 background: "linear-gradient(90deg,#6366f1,#818cf8)", borderRadius: 4,
//                 animation: "progress 1.8s ease-in-out infinite",
//               }} />
//             </div>
//           </div>
//         )}

//         {/* ── SUCCÈS ── */}
//         {etape === "succes" && (
//           <div style={{ textAlign: "center", padding: "12px 0" }}>
//             <motion.div
//               initial={{ scale: .5, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ type: "spring", stiffness: 300, damping: 20 }}
//               style={{
//                 width: 80, height: 80, borderRadius: "50%",
//                 background: "#f0fdf4", border: "3px solid #bbf7d0",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 margin: "0 auto 22px",
//               }}
//             >
//               <FiCheckCircle size={36} color="#22c55e" />
//             </motion.div>
//             <h3 style={{ fontSize: 20, fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
//               Vote enregistré !
//             </h3>
//             <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
//               Votre vote pour <strong>{candidat?.prenom} {candidat?.nom}</strong> a été confirmé.
//               Vous pouvez voter à nouveau en payant les frais.
//             </p>
//             <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
//               <button onClick={onFermer} style={{ ...BTN_OUTLINE, borderRadius: 12 }}>
//                 Voter à nouveau
//               </button>
//               <button onClick={() => window.location.href = `/dashboard-electeur/${telephone}`} style={{
//                 ...BTN_FILLED,
//                 background: "linear-gradient(135deg,#22c55e,#16a34a)",
//                 boxShadow: "0 6px 18px rgba(34,197,94,0.35)",
//               }}>
//                 Mon tableau de bord
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ── ERREUR ── */}
//         {etape === "erreur" && (
//           <div style={{ textAlign: "center", padding: "12px 0" }}>
//             <div style={{
//               width: 80, height: 80, borderRadius: "50%",
//               background: "#fef2f2", border: "3px solid #fecaca",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               margin: "0 auto 22px",
//             }}>
//               <FiXCircle size={36} color="#ef4444" />
//             </div>
//             <h3 style={{ fontSize: 20, fontWeight: 900, color: "#dc2626", marginBottom: 12 }}>
//               Paiement échoué
//             </h3>
//             <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7, marginBottom: 28 }}>
//               {msgErreur || "Le paiement a échoué ou le délai a expiré."}
//             </p>
//             <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
//               <button onClick={onFermer} style={BTN_OUTLINE}>Fermer</button>
//               <button onClick={onReessayer} style={{ ...BTN_FILLED, background: "linear-gradient(135deg,#6366f1,#4f46e5)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
//                 Réessayer
//               </button>
//             </div>
//           </div>
//         )}

//         <style>{`
//           @keyframes spin{to{transform:rotate(360deg);}}
//           @keyframes progress{0%{transform:translateX(-100%);}60%{transform:translateX(200%);}100%{transform:translateX(500%);}}
//         `}</style>
//       </motion.div>
//     </div>
//   );
// }

// // ─── Page principale ─────────────────────────────────────────────────────────
// export default function VoterPublicPage() {
//   const { id }    = useParams();
//   const navigate  = useNavigate();

//   const [data,        setData]        = useState(null);
//   const [loading,     setLoading]     = useState(true);
//   const [errPage,     setErrPage]     = useState("");
//   const [candidatSel, setCandidatSel] = useState(null);

//   // Paiement state
//   const [etape,       setEtape]       = useState("");
//   const [telephone,   setTelephone]   = useState("");
//   const [nomElecteur,  setNomElecteur]  = useState("");
//   const [emailElecteur, setEmailElecteur] = useState("");
//   const [campayRef,   setCampayRef]   = useState(null);
//   const [msgErreur,   setMsgErreur]   = useState("");
//   const [voteId,      setVoteId]      = useState(null);

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setData(r.data))
//       .catch(() => setErrPage("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   // Rafraîchir résultats toutes les 10s si en cours
//   useEffect(() => {
//     if (!data?.election || data.election.statut !== "EN_COURS") return;
//     const iv = setInterval(() => {
//       api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//     }, 10000);
//     return () => clearInterval(iv);
//   }, [data?.election?.statut]);

//   const handleVoter = (candidat) => {
//     setCandidatSel(candidat);
//     setTelephone("");
//     setNomElecteur("");
//     setEmailElecteur("");
//     setEtape("saisie");
//   };

//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) return;

//     setEtape("attente");
//     try {
//       const { data: res } = await api.post(`/public-elections/${id}/voter`, {
//         candidat_public_id: candidatSel.id,
//         telephone: `237${telephone}`,
//         nom_electeur:   nomElecteur   || undefined,
//         email_electeur: emailElecteur || undefined,
//       });
//       setCampayRef(res.campay_reference);
//       setVoteId(res.vote_id);
//       lancerPolling(res.campay_reference);
//     } catch (err) {
//       setMsgErreur(err.response?.data?.message || "Erreur initialisation paiement.");
//       setEtape("erreur");
//     }
//   };

//   const lancerPolling = (reference) => {
//     let tentatives = 0;
//     const iv = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data: s } = await api.get(`/public-elections/vote-statut/${reference}`);
//         if (s.status === "SUCCESSFUL") {
//           clearInterval(iv);
//           setEtape("succes");
//           // Rafraîchir les candidats
//           api.get(`/public-elections/${id}/detail`).then(r => setData(r.data)).catch(() => {});
//         } else if (s.status === "FAILED" || tentatives >= 12) {
//           clearInterval(iv);
//           setMsgErreur("Paiement échoué ou délai de 60 secondes dépassé.");
//           setEtape("erreur");
//         }
//       } catch {
//         clearInterval(iv);
//         setMsgErreur("Erreur lors de la vérification.");
//         setEtape("erreur");
//       }
//     }, 5000);
//   };

//   const maxVotes = data?.candidats?.reduce((m, c) => Math.max(m, c.nb_votes), 0) || 0;

//   if (loading) return (
//     <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif" }}>
//       <FiLoader size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   if (errPage) return (
//     <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Outfit, sans-serif", gap: 16, color: "#64748b" }}>
//       <span style={{ fontSize: 40 }}>🗳</span>
//       <p style={{ fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>{errPage}</p>
//       <button onClick={() => navigate("/")} style={{ padding: "10px 24px", borderRadius: 10, background: "#4f46e5", color: "white", border: "none", fontFamily: "inherit", fontWeight: 700, cursor: "pointer" }}>
//         Retour à l'accueil
//       </button>
//     </div>
//   );

//   const { election, candidats } = data;
//   const enCours = election.statut === "EN_COURS";
//   const totalVotes = candidats.reduce((s, c) => s + c.nb_votes, 0);

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="vp-root">
//         <div className="vp-orb vp-orb-1" />
//         <div className="vp-orb vp-orb-2" />

//         {/* Modal paiement */}
//         <AnimatePresence>
//           {etape && (
//             <ModalPaiement
//               candidat={candidatSel}
//               election={election}
//               etape={etape}
//               telephone={telephone}
//               setTelephone={setTelephone}
//               nomElecteur={nomElecteur}
//               setNomElecteur={setNomElecteur}
//               emailElecteur={emailElecteur}
//               setEmailElecteur={setEmailElecteur}
//               campayRef={campayRef}
//               msgErreur={msgErreur}
//               onPayer={handlePayer}
//               onFermer={() => setEtape("")}
//               onReessayer={() => { setEtape("saisie"); setMsgErreur(""); }}
//             />
//           )}
//         </AnimatePresence>

//         {/* Navbar */}
//         <nav className="vp-nav">
//           <div className="vp-nav-inner">
//             <a href="/" className="vp-logo">🗳 <strong>EVote</strong></a>
//             <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//               <a href={`/dashboard-electeur/${telephone || "votre-telephone"}`} className="vp-nav-link">
//                 <BarChart3 size={14} /> Mon tableau de bord
//               </a>
//               <button onClick={() => navigate(-1)} className="vp-back">
//                 <FiArrowLeft size={14} /> Retour
//               </button>
//             </div>
//           </div>
//         </nav>

//         <main className="vp-main">
//           {/* En-tête élection */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="vp-header-card"
//           >
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
//               <div>
//                 <div className="vp-badge-row">
//                   <span className={`vp-statut-badge ${enCours ? "vp-statut-badge--green" : "vp-statut-badge--blue"}`}>
//                     {enCours && <span className="vp-dot" />}
//                     {enCours ? "Élection en cours" : "Élection à venir"}
//                   </span>
//                   <span className="vp-public-badge">🌐 Publique</span>
//                 </div>
//                 <h1 className="vp-title">{election.titre}</h1>
//                 {election.description && <p className="vp-desc">{election.description}</p>}
//               </div>
//               <div style={{ textAlign: "right" }}>
//                 <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>Frais de vote</p>
//                 <p style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{election.frais_vote_xaf || 10} XAF</p>
//                 <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>par vote · MTN / Orange</p>
//               </div>
//             </div>

//             {/* Stats */}
//             <div className="vp-stats-row">
//               {[
//                 { label: "Candidats", value: candidats.length, icon: <FiUsers size={14}/> },
//                 { label: "Votes total", value: totalVotes, icon: <BarChart3 size={14}/> },
//                 { label: "Clôture", value: formatDate(election.date_fin), icon: null },
//               ].map((s, i) => (
//                 <div key={i} className="vp-stat-item">
//                   {s.icon && <span style={{ opacity: .8 }}>{s.icon}</span>}
//                   <span className="vp-stat-val">{s.value}</span>
//                   <span className="vp-stat-label">{s.label}</span>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Candidats */}
//           <div style={{ maxWidth: 800, margin: "32px auto 0" }}>
//             <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e1b4b", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
//               <FiUsers size={18} color="#6366f1" />
//               Candidats ({candidats.length})
//             </h2>

//             {candidats.length === 0 ? (
//               <div style={{ textAlign: "center", padding: "48px 24px", background: "white", borderRadius: 20, border: "1px solid #f0f0f0", color: "#94a3b8" }}>
//                 <div style={{ fontSize: 36, marginBottom: 12 }}>🕐</div>
//                 <p style={{ fontWeight: 600, color: "#64748b" }}>Aucun candidat approuvé pour l'instant</p>
//               </div>
//             ) : (
//               <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
//                 {candidats.map((c, idx) => {
//                   const pct = maxVotes > 0 ? Math.round((c.nb_votes / maxVotes) * 100) : 0;
//                   const isLeader = c.nb_votes > 0 && c.nb_votes === maxVotes;
//                   return (
//                     <motion.div
//                       key={c.id}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: idx * 0.07 }}
//                       style={{
//                         background: "white", borderRadius: 18,
//                         border: isLeader ? "2px solid #6366f1" : "1px solid #f0f0f0",
//                         boxShadow: isLeader ? "0 4px 20px rgba(99,102,241,0.15)" : "0 2px 10px rgba(0,0,0,0.05)",
//                         padding: "20px 24px",
//                         display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
//                       }}
//                     >
//                       {/* Rang */}
//                       <div style={{
//                         width: 40, height: 40, borderRadius: 12, flexShrink: 0,
//                         background: idx === 0 ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#eef2ff",
//                         display: "flex", alignItems: "center", justifyContent: "center",
//                         fontSize: idx === 0 ? "20px" : "16px", fontWeight: 800,
//                         color: idx === 0 ? "white" : "#6366f1",
//                       }}>
//                         {idx === 0 ? "🏆" : `#${idx+1}`}
//                       </div>

//                       {/* Infos candidat */}
//                       <div style={{ flex: 1, minWidth: 160 }}>
//                         <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
//                           <p style={{ fontWeight: 800, fontSize: 15, color: "#1e1b4b", margin: 0 }}>
//                             {c.prenom} {c.nom}
//                           </p>
//                           {isLeader && <span style={{ background: "#eef2ff", color: "#6366f1", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>🥇 En tête</span>}
//                         </div>
//                         {c.bio && <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{c.bio.slice(0, 80)}{c.bio.length > 80 ? "…" : ""}</p>}

//                         {/* Barre de votes */}
//                         <div style={{ marginTop: 10 }}>
//                           <div style={{ height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
//                             <motion.div
//                               initial={{ width: 0 }}
//                               animate={{ width: `${pct}%` }}
//                               transition={{ duration: .8, ease: "easeOut" }}
//                               style={{
//                                 height: "100%",
//                                 background: isLeader ? "linear-gradient(90deg,#6366f1,#818cf8)" : "#c7d2fe",
//                                 borderRadius: 999,
//                               }}
//                             />
//                           </div>
//                           <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
//                             <strong style={{ color: "#6366f1" }}>{c.nb_votes}</strong> vote{c.nb_votes > 1 ? "s" : ""}
//                             {totalVotes > 0 && ` · ${Math.round((c.nb_votes/totalVotes)*100)}%`}
//                           </p>
//                         </div>
//                       </div>

//                       {/* Bouton voter */}
//                       {enCours && (
//                         <button
//                           onClick={() => handleVoter(c)}
//                           style={{
//                             padding: "10px 20px", borderRadius: 12, border: "none",
//                             background: "linear-gradient(135deg,#4f46e5,#6366f1)",
//                             color: "white", fontSize: 13, fontWeight: 700,
//                             cursor: "pointer", fontFamily: "inherit",
//                             boxShadow: "0 4px 12px rgba(79,70,229,0.30)",
//                             whiteSpace: "nowrap", transition: "all .2s",
//                             flexShrink: 0,
//                           }}
//                           onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
//                           onMouseLeave={e => e.target.style.transform = "translateY(0)"}
//                         >
//                           Voter 
//                         </button>
//                       )}
//                     </motion.div>
//                   );
//                 })}
//               </div>
//             )}

//             {/* Bandeau dashboard électeur */}
//             <div style={{
//               marginTop: 32, background: "linear-gradient(135deg,#eef2ff,#e0e7ff)",
//               border: "1.5px solid #c7d2fe", borderRadius: 16, padding: "20px 24px",
//               display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
//             }}>
//               <div>
//                 <p style={{ fontWeight: 800, color: "#3730a3", margin: "0 0 4px" }}>📊 Suivez vos votes</p>
//                 <p style={{ fontSize: 13, color: "#6366f1", margin: 0 }}>
//                   Consultez votre tableau de bord avec votre numéro de téléphone.
//                 </p>
//               </div>
//               <a
//                 href="/dashboard-electeur"
//                 style={{
//                   display: "inline-flex", alignItems: "center", gap: 7,
//                   padding: "10px 20px", borderRadius: 12,
//                   background: "linear-gradient(135deg,#4f46e5,#6366f1)",
//                   color: "white", textDecoration: "none", fontSize: 13, fontWeight: 700,
//                   boxShadow: "0 4px 12px rgba(79,70,229,0.30)",
//                 }}
//               >
//                 Mon tableau de bord <FiArrowRight size={13} />
//               </a>
//             </div>
//           </div>
//         </main>
//       </div>
//     </>
//   );
// }

// // ─── Styles ──────────────────────────────────────────────────────────────────
// const LABEL_STYLE = {
//   display: "block", fontSize: 11, fontWeight: 700,
//   color: "#64748b", textTransform: "uppercase", letterSpacing: .7,
// };
// const INPUT_STYLE = {
//   width: "100%", padding: "12px 14px",
//   border: "2px solid #e0e7ff", borderRadius: 12,
//   fontSize: 14, fontFamily: "Outfit, sans-serif",
//   color: "#1e293b", background: "#fafafa", outline: "none",
// };
// const BTN_OUTLINE = {
//   flex: 1, padding: "13px", borderRadius: 14,
//   border: "1.5px solid #e2e8f0", background: "#fff",
//   color: "#64748b", fontSize: 14, fontWeight: 600,
//   cursor: "pointer", fontFamily: "Outfit, sans-serif",
// };
// const BTN_FILLED = {
//   flex: 2, padding: "13px", borderRadius: 14, border: "none",
//   fontSize: 14, fontWeight: 800, fontFamily: "Outfit, sans-serif",
//   transition: "all .25s",
// };

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   .vp-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
//   .vp-orb{position:fixed;border-radius:50%;filter:blur(90px);pointer-events:none;z-index:0;}
//   .vp-orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-180px;left:-180px;}
//   .vp-orb-2{width:380px;height:380px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-100px;right:-80px;}
//   .vp-nav{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
//   .vp-nav-inner{max-width:840px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;}
//   .vp-logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-size:18px;font-weight:700;color:#4f46e5;}
//   .vp-nav-link{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:none;background:transparent;color:#64748b;font-size:13px;font-weight:600;text-decoration:none;transition:all .15s;}
//   .vp-nav-link:hover{background:#eef2ff;color:#4f46e5;}
//   .vp-back{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
//   .vp-back:hover{background:#f8fafc;}
//   .vp-main{position:relative;z-index:1;padding:40px 24px 80px;}
//   .vp-header-card{max-width:840px;margin:0 auto;background:linear-gradient(135deg,#4f46e5,#4338ca);border-radius:24px;padding:32px;color:white;box-shadow:0 12px 48px rgba(79,70,229,0.25);}
//   .vp-badge-row{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
//   .vp-statut-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.3px;}
//   .vp-statut-badge--green{background:#f0fdf4;color:#15803d;}
//   .vp-statut-badge--blue{background:#eff6ff;color:#1d4ed8;}
//   .vp-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;animation:blink 1.2s ease-in-out infinite;flex-shrink:0;}
//   @keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
//   .vp-public-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);color:rgba(255,255,255,.9);padding:5px 12px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,0.25);}
//   .vp-title{font-size:28px;font-weight:900;letter-spacing:-0.5px;margin-bottom:8px;line-height:1.2;}
//   .vp-desc{font-size:14px;color:rgba(255,255,255,0.75);line-height:1.6;margin:0;}
//   .vp-stats-row{display:flex;gap:0;margin-top:24px;background:rgba(255,255,255,0.12);border-radius:14px;overflow:hidden;}
//   .vp-stat-item{flex:1;padding:14px 16px;display:flex;flex-direction:column;align-items:center;gap:4px;border-right:1px solid rgba(255,255,255,0.15);}
//   .vp-stat-item:last-child{border-right:none;}
//   .vp-stat-val{font-size:18px;font-weight:900;color:white;}
//   .vp-stat-label{font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;text-transform:uppercase;letter-spacing:.4px;}
//   @media(max-width:600px){.vp-title{font-size:22px;}.vp-header-card{padding:24px 20px;}.vp-nav-link span{display:none;}}
// `;
