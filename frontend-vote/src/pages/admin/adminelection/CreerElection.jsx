// src/pages/admin/adminelection/CreerElection.jsx
import React, { useState, useRef } from "react";
import {
  FiSave, FiArrowLeft, FiCalendar, FiClock,
  FiInfo, FiUsers, FiSmartphone, FiCheckCircle,
  FiXCircle, FiLoader, FiGlobe, FiEyeOff,
  FiImage, FiUpload, FiTrash2,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Election from './Election.webp';
import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

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

const TYPE_INFO = {
  UNINOMINAL: { emoji: "1️⃣", title: "Uninominal",               desc: "Chaque électeur vote pour un seul candidat. Le candidat avec le plus de voix gagne." },
  BINOMINAL:  { emoji: "2️⃣", title: "Binominal",               desc: "Chaque électeur vote pour exactement 2 candidats. Utile pour élire un titulaire et son suppléant." },
  LISTE:      { emoji: "📋", title: "Liste — Tours successifs", desc: "Vote pour une liste complète. Une majorité absolue (> 50%) est nécessaire. Sans vainqueur, un nouveau tour s'ouvre automatiquement." },
};

const FRAIS_ELECTION = 25;

const toLocalMySQL = (date) => {
  const pad = n => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
  );
};

// Sélecteur Visibilité
function VisibiliteSelector({ value, onChange }) {
  const options = [
    {
      value: "PRIVE",
      icon: <FiEyeOff size={16} />,
      label: "🔒 Privée",
      desc: "Seul l'admin gère les candidats et électeurs",
      activeColor: "#6366f1", activeBg: "#eef2ff", activeBorder: "#6366f1",
    },
    {
      value: "PUBLIQUE",
      icon: <FiGlobe size={16} />,
      label: "🌍 Publique",
      desc: "Visible sur l'accueil, candidatures & votes ouverts",
      activeColor: "#0ea5e9", activeBg: "#f0f9ff", activeBorder: "#0ea5e9",
    },
  ];

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <FiGlobe size={11} className="text-indigo-500" /> Mode de l'élection *
      </label>
      <div className="grid grid-cols-2 gap-3">
        {options.map(opt => {
          const isSelected = value === opt.value;
          return (
            <div
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                padding: "14px", borderRadius: "14px", cursor: "pointer",
                border: `2px solid ${isSelected ? opt.activeBorder : "#e5e7eb"}`,
                background: isSelected ? opt.activeBg : "#fafafa",
                transition: "all .2s", position: "relative",
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute", top: 8, right: 8,
                  width: 16, height: 16, borderRadius: "50%",
                  background: opt.activeColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FiCheckCircle size={10} color="white" />
                </div>
              )}
              <div style={{ color: isSelected ? opt.activeColor : "#9ca3af", marginBottom: "6px" }}>
                {opt.icon}
              </div>
              <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: "13px", color: isSelected ? opt.activeColor : "#374151" }}>
                {opt.label}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", lineHeight: 1.5 }}>
                {opt.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant Upload Photo
function PhotoUpload({ preview, onFileChange, onRemove }) {
  const inputRef = useRef(null);

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <FiImage size={11} className="text-indigo-500" /> Photo de l'élection
        <span className="normal-case font-normal text-gray-400 tracking-normal ml-1">(optionnel)</span>
      </label>

      {preview ? (
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1.5px solid #e0e7ff" }}>
          <img
            src={preview}
            alt="Aperçu"
            style={{ width: "100%", height: "150px", objectFit: "cover", display: "block" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)",
          }} />
          <div style={{ position: "absolute", bottom: "10px", right: "10px", display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                padding: "5px 12px", borderRadius: "8px",
                background: "rgba(255,255,255,0.92)", border: "none",
                color: "#4f46e5", fontSize: "12px", fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
              }}
            >
              <FiUpload size={11} /> Changer
            </button>
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: "5px 10px", borderRadius: "8px",
                background: "rgba(239,68,68,0.9)", border: "none",
                color: "white", fontSize: "12px", fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
              }}
            >
              <FiTrash2 size={11} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            border: "2px dashed #c7d2fe", borderRadius: "12px",
            padding: "24px 16px", textAlign: "center",
            cursor: "pointer", background: "#fafbff",
            transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#fafbff"; }}
        >
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: "#eef2ff", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 8px",
          }}>
            <FiUpload size={18} color="#6366f1" />
          </div>
          <p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>
            Cliquez pour ajouter une photo
          </p>
          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
            PNG, JPG, WEBP — max 5 Mo
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={onFileChange}
      />
    </div>
  );
}

// Modal Paiement CamPay
function ModalPaiement({ etape, telephone, setTelephone, msgPaiement, campayRef, onPayer, onAnnuler, onReessayer }) {
  if (!["telephone", "attente", "succes", "erreur"].includes(etape)) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "16px",
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px",
        padding: "36px 32px", width: "100%", maxWidth: "420px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "4px",
          background: etape === "succes"
            ? "linear-gradient(90deg, #22c55e, #16a34a)"
            : etape === "erreur"
            ? "linear-gradient(90deg, #ef4444, #dc2626)"
            : "linear-gradient(90deg, #6366f1, #4f46e5)",
        }} />

        {etape === "telephone" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{
                width: "60px", height: "60px", borderRadius: "16px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
              }}>
                <FiSmartphone size={26} color="white" />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>
                Paiement des frais
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Des frais de{" "}
                <strong style={{ color: "#6366f1" }}>{FRAIS_ELECTION} XAF</strong>{" "}
                sont requis pour créer une élection.
              </p>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block", fontSize: "11px", fontWeight: 700,
                color: "#64748b", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "8px",
              }}>
                Numéro MTN / Orange Money
              </label>
              <div style={{
                display: "flex", border: "1.5px solid #e0e7ff",
                borderRadius: "12px", overflow: "hidden",
              }}>
                <span style={{
                  padding: "12px 14px", background: "#eef2ff",
                  color: "#6366f1", fontWeight: 700, fontSize: "14px",
                  borderRight: "1.5px solid #e0e7ff", whiteSpace: "nowrap",
                }}>
                  +237
                </span>
                <input
                  type="tel" maxLength={9} placeholder="6XXXXXXXX"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  style={{
                    flex: 1, border: "none", outline: "none",
                    padding: "12px 14px", fontSize: "15px",
                    fontFamily: "inherit", color: "#1e293b",
                    background: "transparent", letterSpacing: "1px",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {[
                { label: "MTN MoMo",     color: "#f59e0b", bg: "#fffbeb" },
                { label: "Orange Money", color: "#f97316", bg: "#fff7ed" },
              ].map(op => (
                <div key={op.label} style={{
                  flex: 1, padding: "8px 10px", borderRadius: "10px",
                  background: op.bg, border: `1px solid ${op.color}30`,
                  textAlign: "center", fontSize: "12px", fontWeight: 600, color: op.color,
                }}>
                  ✓ {op.label}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={onAnnuler} style={{
                flex: 1, padding: "12px", borderRadius: "12px",
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "#64748b", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Annuler
              </button>
              <button onClick={onPayer} disabled={telephone.length !== 9} style={{
                flex: 2, padding: "12px", borderRadius: "12px", border: "none",
                background: telephone.length === 9 ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "#e2e8f0",
                color: telephone.length === 9 ? "#fff" : "#94a3b8",
                fontSize: "14px", fontWeight: 700,
                cursor: telephone.length === 9 ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                boxShadow: telephone.length === 9 ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
                transition: "all .2s",
              }}>
                💳 Payer {FRAIS_ELECTION} XAF
              </button>
            </div>
          </>
        )}

        {etape === "attente" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#eef2ff", border: "3px solid #c7d2fe",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <FiLoader size={30} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e1b4b", marginBottom: "10px" }}>
              En attente de confirmation
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6, marginBottom: "20px" }}>
              Une notification a été envoyée sur votre téléphone.<br />
              <strong style={{ color: "#6366f1" }}>Entrez votre PIN Mobile Money</strong> pour confirmer.
            </p>
            {campayRef && (
              <div style={{
                background: "#f8fafc", borderRadius: "12px", padding: "14px 16px",
                border: "1px solid #e2e8f0", marginBottom: "20px",
              }}>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>
                  Référence
                </p>
                <p style={{ fontSize: "13px", color: "#475569", fontWeight: 600, margin: 0, wordBreak: "break-all" }}>
                  {campayRef}
                </p>
              </div>
            )}
            <div style={{ height: "4px", background: "#e0e7ff", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: "40%",
                background: "linear-gradient(90deg, #6366f1, #818cf8)",
                borderRadius: "4px", animation: "progress 2s ease-in-out infinite",
              }} />
            </div>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
              Vérification automatique… (60s max)
            </p>
          </div>
        )}

        {etape === "succes" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#f0fdf4", border: "3px solid #bbf7d0",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <FiCheckCircle size={32} color="#22c55e" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#15803d", marginBottom: "10px" }}>
              Paiement confirmé !
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
              Votre élection a été créée avec succès et est en attente de validation par le Super Admin.
            </p>
            <button onClick={onAnnuler} style={{
              padding: "12px 28px", borderRadius: "12px",
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              color: "#fff", border: "none", fontSize: "14px", fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
            }}>
              Voir mes élections →
            </button>
          </div>
        )}

        {etape === "erreur" && (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "#fef2f2", border: "3px solid #fecaca",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <FiXCircle size={32} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#dc2626", marginBottom: "10px" }}>
              Paiement échoué
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
              {msgPaiement || "Le paiement a échoué ou le délai a été dépassé."}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={onAnnuler} style={{
                padding: "12px 20px", borderRadius: "12px",
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "#64748b", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Fermer
              </button>
              <button onClick={onReessayer} style={{
                padding: "12px 20px", borderRadius: "12px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff", border: "none", fontSize: "14px", fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
              }}>
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

// Composant principal
export default function CreerElection() {
  const [form, setForm] = useState({
    title: "", description: "", type: "UNINOMINAL",
    startDate: "", endDate: "",
    dureeTourMinutes: 1440, nbSieges: 29,
    visibilite: "PRIVE",
  });
  const [loading, setLoading] = useState(false);

  // PHOTO
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [etapePaiement, setEtapePaiement] = useState("");
  const [telephone,     setTelephone]     = useState("");
  const [campayRef,     setCampayRef]     = useState(null);
  const [msgPaiement,   setMsgPaiement]   = useState("");

  const isListe  = form.type === "LISTE";
  const typeInfo = TYPE_INFO[form.type];

  const bonusSieges = isListe && form.nbSieges ? Math.floor(form.nbSieges / 2) : 0;
  const resteSieges = isListe && form.nbSieges ? form.nbSieges - bonusSieges   : 0;

  const dateFinTour1 = isListe && form.startDate
    ? (() => {
        const d = new Date(form.startDate);
        d.setMinutes(d.getMinutes() + form.dureeTourMinutes);
        return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      })()
    : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: (name === "dureeTourMinutes" || name === "nbSieges") ? parseInt(value) || 0 : value,
    }));
  };

  const handleVisibiliteChange = (val) => setForm(prev => ({ ...prev, visibilite: val }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo ne doit pas dépasser 5 Mo.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isListe && new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("La date de fin doit être postérieure à la date de début.");
      return;
    }
    if (isListe && (!form.nbSieges || form.nbSieges < 1)) {
      toast.error("Le nombre de sièges doit être supérieur à 0.");
      return;
    }
    setTelephone("");
    setEtapePaiement("telephone");
  };

  const handlePayer = async () => {
    if (!/^[0-9]{9}$/.test(telephone)) {
      toast.error("Numéro invalide. Saisissez 9 chiffres sans l'indicatif.");
      return;
    }

    setLoading(true);
    setEtapePaiement("attente");

    try {
      const dateDebut = toLocalMySQL(new Date(form.startDate));
      const dateFin   = isListe
        ? toLocalMySQL(new Date(new Date(form.startDate).getTime() + form.dureeTourMinutes * 60000))
        : toLocalMySQL(new Date(form.endDate));

      // Upload photo si présente
      let photoUrl = null;
      if (photoFile) {
        const fd = new FormData();
        fd.append("photo", photoFile);
        const uploadRes = await api.post("/upload/election-photo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photoUrl = uploadRes.data.url;
      }

      const { data } = await api.post("/campay/initier-paiement", {
        telephone: `237${telephone}`,
        donnees_election: {
          titre:            form.title,
          description:      form.description,
          type:             form.type,
          visibilite:       form.visibilite,
          startDate:        dateDebut,
          endDate:          dateFin,
          dureeTourMinutes: isListe ? form.dureeTourMinutes : null,
          nbSieges:         isListe ? form.nbSieges         : null,
          photoUrl,  // envoyé au backend
        },
      });

      setCampayRef(data.campay_reference);
      setMsgPaiement(data.message);
      lancerPolling(data.campay_reference);
    } catch (err) {
      setMsgPaiement(err.response?.data?.message || "Erreur lors de l'initialisation du paiement.");
      setEtapePaiement("erreur");
      setLoading(false);
    }
  };

  const lancerPolling = (reference) => {
    let tentatives = 0;
    const interval = setInterval(async () => {
      tentatives++;
      try {
        const { data } = await api.get(`/campay/statut/${reference}`);
        if (data.status === "SUCCESSFUL") {
          clearInterval(interval);
          setEtapePaiement("succes");
          setLoading(false);
          toast.success(`Election "${form.title}" créée avec succès !`, { autoClose: 6000 });
          setForm({ title: "", description: "", startDate: "", endDate: "", type: "UNINOMINAL", dureeTourMinutes: 1440, nbSieges: 29, visibilite: "PRIVE" });
          setPhotoFile(null);
          setPhotoPreview(null);
        } else if (data.status === "FAILED" || tentatives >= 12) {
          clearInterval(interval);
          setMsgPaiement("Paiement échoué ou délai de 60 secondes dépassé.");
          setEtapePaiement("erreur");
          setLoading(false);
        }
      } catch {
        clearInterval(interval);
        setMsgPaiement("Erreur lors de la vérification du paiement.");
        setEtapePaiement("erreur");
        setLoading(false);
      }
    }, 5000);
  };

  const handleAnnuler   = () => { setEtapePaiement(""); setLoading(false); };
  const handleReessayer = () => { setEtapePaiement("telephone"); setTelephone(""); };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
      <AdminElectionSidebar active="elections" />

      <ModalPaiement
        etape={etapePaiement} telephone={telephone} setTelephone={setTelephone}
        msgPaiement={msgPaiement} campayRef={campayRef}
        onPayer={handlePayer} onAnnuler={handleAnnuler} onReessayer={handleReessayer}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Nouvelle élection</h2>
            <p className="text-sm text-indigo-400 mt-1">
              Frais de création :{" "}
              <strong className="text-indigo-600">{FRAIS_ELECTION} XAF</strong> — payés via Mobile Money
            </p>
          </div>
          <Link
            to="/admin/adminelection/ElectionPage"
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm"
          >
            <FiArrowLeft size={14} /> Retour
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

            {/* Titre */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Titre *
              </label>
              <input
                type="text" name="title" value={form.title} onChange={handleChange} required
                placeholder="Ex : Élection du bureau étudiant 2026"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                name="description" value={form.description} onChange={handleChange} rows="3"
                placeholder="Décrivez l'objet de cette élection…"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
              />
            </div>

            {/* PHOTO UPLOAD */}
            <PhotoUpload
              preview={photoPreview}
              onFileChange={handlePhotoChange}
              onRemove={handlePhotoRemove}
            />

            {/* Visibilité */}
            <VisibiliteSelector value={form.visibilite} onChange={handleVisibiliteChange} />

            {form.visibilite === "PUBLIQUE" && (
              <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl p-3.5">
                <FiGlobe size={13} className="text-sky-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-sky-700 leading-relaxed">
                  <strong>Élection publique :</strong> Elle apparaîtra sur la page d'accueil du site.
                  N'importe qui pourra postuler comme candidat ou s'inscrire pour voter.
                </p>
              </div>
            )}

            {/* Type scrutin */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Type de scrutin *
              </label>
              <select
                name="type" value={form.type} onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
              >
                <option value="UNINOMINAL">Uninominal</option>
                <option value="BINOMINAL">Binominal</option>
                <option value="LISTE">Liste (tours successifs)</option>
              </select>
            </div>

            {/* Date début */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Date et heure de début *
              </label>
              <input
                type="datetime-local" name="startDate" value={form.startDate}
                onChange={handleChange} required
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            {/* Date fin */}
            {!isListe && (
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Date et heure de fin *
                </label>
                <input
                  type="datetime-local" name="endDate" value={form.endDate}
                  onChange={handleChange} required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            )}

            {/* Options LISTE */}
            {isListe && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-indigo-100" />
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">Scrutin de liste</span>
                  <div className="flex-1 h-px bg-indigo-100" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiClock size={11} className="text-indigo-500" /> Durée par tour *
                    </label>
                    <select
                      name="dureeTourMinutes" value={form.dureeTourMinutes}
                      onChange={handleChange} required
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                    >
                      {DUREE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <FiUsers size={11} className="text-indigo-500" /> Nombre de sièges *
                    </label>
                    <input
                      type="number" name="nbSieges" value={form.nbSieges}
                      onChange={handleChange} required min="1" max="999" placeholder="Ex : 29"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
                {form.nbSieges > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-indigo-500 mb-2.5 flex items-center gap-1.5">
                      <FiInfo size={11} /> Aperçu de la répartition des sièges
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg p-2 border border-indigo-100">
                        <p className="text-lg font-black text-indigo-700">{form.nbSieges}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Total sièges</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                        <p className="text-lg font-black text-amber-600">{bonusSieges}</p>
                        <p className="text-xs text-amber-500 mt-0.5">Bonus gagnant</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-indigo-100">
                        <p className="text-lg font-black text-indigo-500">{resteSieges}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Répartis proportions</p>
                      </div>
                    </div>
                  </div>
                )}
                {dateFinTour1 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
                      <FiCalendar size={11} /> Aperçu du calendrier
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Début Tour 1</span>
                        <span className="font-semibold text-indigo-700">
                          {new Date(form.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fin Tour 1</span>
                        <span className="font-semibold text-indigo-600">{dateFinTour1}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
                  <FiInfo size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement.
                  </p>
                </div>
              </div>
            )}

            {/* Frais CamPay */}
            <div style={{
              background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
              border: "1.5px solid #c7d2fe", borderRadius: "12px",
              padding: "12px 16px", display: "flex",
              alignItems: "center", justifyContent: "space-between", gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "20px" }}>💳</span>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#4338ca", margin: 0 }}>
                    Frais de création
                  </p>
                  <p style={{ fontSize: "11px", color: "#6366f1", margin: 0 }}>
                    Paiement Mobile Money requis
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: "16px", fontWeight: 900, color: "#4338ca",
                background: "#fff", padding: "4px 12px", borderRadius: "8px",
                border: "1px solid #c7d2fe",
              }}>
                {FRAIS_ELECTION} XAF
              </span>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit" disabled={loading}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all w-full justify-center ${
                  loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200/60"
                }`}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Traitement…</>
                ) : (
                  <><FiSave size={14} /> Continuer vers le paiement</>
                )}
              </button>
            </div>
          </form>

          {/* Panneau latéral */}
          <div className="lg:col-span-2 space-y-4">
            {/* Preview photo ou image par défaut */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {photoPreview ? (
                <img src={photoPreview} alt="Photo élection" className="w-full object-cover" style={{ height: "180px" }} />
              ) : (
                <img src={Election} alt="Élection" className="w-full object-cover" />
              )}
              {photoPreview && (
                <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100">
                  <p className="text-xs text-indigo-600 font-semibold flex items-center gap-1.5">
                    <FiImage size={11} /> Photo de couverture sélectionnée
                  </p>
                </div>
              )}
            </div>

            {/* Info type scrutin */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Type sélectionné</p>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{typeInfo.emoji}</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{typeInfo.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{typeInfo.desc}</p>
                </div>
              </div>
            </div>

            {/* Info visibilité */}
            <div className={`rounded-2xl shadow-sm border p-5 ${
              form.visibilite === "PUBLIQUE" ? "bg-sky-50 border-sky-200" : "bg-white border-gray-200"
            }`}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mode sélectionné</p>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">
                  {form.visibilite === "PUBLIQUE" ? "🌍" : "🔒"}
                </span>
                <div>
                  <p className={`font-bold text-sm ${form.visibilite === "PUBLIQUE" ? "text-sky-700" : "text-gray-800"}`}>
                    Élection {form.visibilite === "PUBLIQUE" ? "Publique" : "Privée"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {form.visibilite === "PUBLIQUE"
                      ? "Visible sur la page d'accueil. Candidatures et votes ouverts à tous."
                      : "Accès restreint. L'admin gère manuellement candidats et électeurs."}
                  </p>
                </div>
              </div>
            </div>

            {/* Processus paiement */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Processus de paiement</p>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Remplissez le formulaire" },
                  { step: "2", text: "Entrez votre numéro MTN / Orange" },
                  { step: "3", text: "Confirmez avec votre PIN sur votre téléphone" },
                  { step: "4", text: "Élection créée automatiquement" },
                ].map(({ step, text }) => (
                  <div key={step} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "6px",
                      background: "#eef2ff", color: "#6366f1",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "11px", fontWeight: 800, flexShrink: 0,
                    }}>
                      {step}
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}

































// // src/pages/admin/adminelection/CreerElection.jsx
// import React, { useState } from "react";
// import {
//   FiSave, FiArrowLeft, FiCalendar, FiClock,
//   FiInfo, FiUsers, FiSmartphone, FiCheckCircle,
//   FiXCircle, FiLoader, FiGlobe, FiEyeOff,
// } from "react-icons/fi";
// import { Link } from "react-router-dom";
// import api from "../../../services/api";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import Election from './Election.webp';
// import AdminElectionSidebar from "../../../components/AdminElectionSidebar";

// // ─── Constantes ───────────────────────────────────────────────────────────────
// const DUREE_OPTIONS = [
//   { value: 30,    label: "30 minutes" },
//   { value: 60,    label: "1 heure" },
//   { value: 120,   label: "2 heures" },
//   { value: 360,   label: "6 heures" },
//   { value: 720,   label: "12 heures" },
//   { value: 1440,  label: "24 heures (1 jour)" },
//   { value: 2880,  label: "48 heures (2 jours)" },
//   { value: 4320,  label: "3 jours" },
//   { value: 10080, label: "7 jours" },
// ];

// const TYPE_INFO = {
//   UNINOMINAL: { emoji: "1️⃣", title: "Uninominal",               desc: "Chaque électeur vote pour un seul candidat. Le candidat avec le plus de voix gagne." },
//   BINOMINAL:  { emoji: "2️⃣", title: "Binominal",               desc: "Chaque électeur vote pour exactement 2 candidats. Utile pour élire un titulaire et son suppléant." },
//   LISTE:      { emoji: "📋", title: "Liste — Tours successifs", desc: "Vote pour une liste complète. Une majorité absolue (> 50%) est nécessaire. Sans vainqueur, un nouveau tour s'ouvre automatiquement." },
// };

// const FRAIS_ELECTION = 25;

// const toLocalMySQL = (date) => {
//   const pad = n => String(n).padStart(2, "0");
//   return (
//     `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
//     ` ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
//   );
// };

// // ─── Sélecteur Visibilité ─────────────────────────────────────────────────────
// function VisibiliteSelector({ value, onChange }) {
//   const options = [
//     {
//       value: "PRIVE",
//       icon: <FiEyeOff size={16} />,
//       label: "🔒 Privée",
//       desc: "Seul l'admin gère les candidats et électeurs",
//       activeColor: "#6366f1",
//       activeBg: "#eef2ff",
//       activeBorder: "#6366f1",
//     },
//     {
//       value: "PUBLIC",
//       icon: <FiGlobe size={16} />,
//       label: "🌍 Publique",
//       desc: "Visible sur l'accueil, candidatures & votes ouverts",
//       activeColor: "#0ea5e9",
//       activeBg: "#f0f9ff",
//       activeBorder: "#0ea5e9",
//     },
//   ];

//   return (
//     <div>
//       <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
//         <FiGlobe size={11} className="text-indigo-500" /> Mode de l'élection *
//       </label>
//       <div className="grid grid-cols-2 gap-3">
//         {options.map(opt => {
//           const isSelected = value === opt.value;
//           return (
//             <div
//               key={opt.value}
//               onClick={() => onChange(opt.value)}
//               style={{
//                 padding: "14px",
//                 borderRadius: "14px",
//                 cursor: "pointer",
//                 border: `2px solid ${isSelected ? opt.activeBorder : "#e5e7eb"}`,
//                 background: isSelected ? opt.activeBg : "#fafafa",
//                 transition: "all .2s",
//                 position: "relative",
//               }}
//             >
//               {isSelected && (
//                 <div style={{
//                   position: "absolute", top: 8, right: 8,
//                   width: 16, height: 16, borderRadius: "50%",
//                   background: opt.activeColor,
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                 }}>
//                   <FiCheckCircle size={10} color="white" />
//                 </div>
//               )}
//               <div style={{ color: isSelected ? opt.activeColor : "#9ca3af", marginBottom: "6px" }}>
//                 {opt.icon}
//               </div>
//               <p style={{
//                 margin: "0 0 3px",
//                 fontWeight: 800,
//                 fontSize: "13px",
//                 color: isSelected ? opt.activeColor : "#374151",
//               }}>
//                 {opt.label}
//               </p>
//               <p style={{ margin: 0, fontSize: "11px", color: "#6b7280", lineHeight: 1.5 }}>
//                 {opt.desc}
//               </p>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

// // ─── Modal Paiement CamPay ────────────────────────────────────────────────────
// function ModalPaiement({ etape, telephone, setTelephone, msgPaiement, campayRef, onPayer, onAnnuler, onReessayer }) {
//   if (!["telephone", "attente", "succes", "erreur"].includes(etape)) return null;

//   return (
//     <div style={{
//       position: "fixed", inset: 0,
//       background: "rgba(15, 23, 42, 0.65)",
//       backdropFilter: "blur(6px)",
//       display: "flex", alignItems: "center", justifyContent: "center",
//       zIndex: 1000, padding: "16px",
//     }}>
//       <div style={{
//         background: "#fff", borderRadius: "20px",
//         padding: "36px 32px", width: "100%", maxWidth: "420px",
//         boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
//         position: "relative", overflow: "hidden",
//       }}>
//         <div style={{
//           position: "absolute", top: 0, left: 0, right: 0, height: "4px",
//           background: etape === "succes"
//             ? "linear-gradient(90deg, #22c55e, #16a34a)"
//             : etape === "erreur"
//             ? "linear-gradient(90deg, #ef4444, #dc2626)"
//             : "linear-gradient(90deg, #6366f1, #4f46e5)",
//         }} />

//         {/* ── Téléphone ── */}
//         {etape === "telephone" && (
//           <>
//             <div style={{ textAlign: "center", marginBottom: "24px" }}>
//               <div style={{
//                 width: "60px", height: "60px", borderRadius: "16px",
//                 background: "linear-gradient(135deg, #6366f1, #4f46e5)",
//                 display: "flex", alignItems: "center", justifyContent: "center",
//                 margin: "0 auto 16px",
//                 boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
//               }}>
//                 <FiSmartphone size={26} color="white" />
//               </div>
//               <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e1b4b", margin: "0 0 6px" }}>
//                 Paiement des frais
//               </h3>
//               <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
//                 Des frais de{" "}
//                 <strong style={{ color: "#6366f1" }}>{FRAIS_ELECTION} XAF</strong>{" "}
//                 sont requis pour créer une élection.
//               </p>
//             </div>

//             <div style={{ marginBottom: "20px" }}>
//               <label style={{
//                 display: "block", fontSize: "11px", fontWeight: 700,
//                 color: "#64748b", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: "8px",
//               }}>
//                 Numéro MTN / Orange Money
//               </label>
//               <div style={{
//                 display: "flex", border: "1.5px solid #e0e7ff",
//                 borderRadius: "12px", overflow: "hidden",
//               }}>
//                 <span style={{
//                   padding: "12px 14px", background: "#eef2ff",
//                   color: "#6366f1", fontWeight: 700, fontSize: "14px",
//                   borderRight: "1.5px solid #e0e7ff", whiteSpace: "nowrap",
//                 }}>
//                   +237
//                 </span>
//                 <input
//                   type="tel" maxLength={9} placeholder="6XXXXXXXX"
//                   value={telephone}
//                   onChange={e => setTelephone(e.target.value.replace(/\D/g, ""))}
//                   autoFocus
//                   style={{
//                     flex: 1, border: "none", outline: "none",
//                     padding: "12px 14px", fontSize: "15px",
//                     fontFamily: "inherit", color: "#1e293b",
//                     background: "transparent", letterSpacing: "1px",
//                   }}
//                 />
//               </div>
//             </div>

//             <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
//               {[
//                 { label: "MTN MoMo",     color: "#f59e0b", bg: "#fffbeb" },
//                 { label: "Orange Money", color: "#f97316", bg: "#fff7ed" },
//               ].map(op => (
//                 <div key={op.label} style={{
//                   flex: 1, padding: "8px 10px", borderRadius: "10px",
//                   background: op.bg, border: `1px solid ${op.color}30`,
//                   textAlign: "center", fontSize: "12px", fontWeight: 600, color: op.color,
//                 }}>
//                   ✓ {op.label}
//                 </div>
//               ))}
//             </div>

//             <div style={{ display: "flex", gap: "10px" }}>
//               <button onClick={onAnnuler} style={{
//                 flex: 1, padding: "12px", borderRadius: "12px",
//                 border: "1.5px solid #e2e8f0", background: "#fff",
//                 color: "#64748b", fontSize: "14px", fontWeight: 600,
//                 cursor: "pointer", fontFamily: "inherit",
//               }}>
//                 Annuler
//               </button>
//               <button onClick={onPayer} disabled={telephone.length !== 9} style={{
//                 flex: 2, padding: "12px", borderRadius: "12px", border: "none",
//                 background: telephone.length === 9 ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "#e2e8f0",
//                 color: telephone.length === 9 ? "#fff" : "#94a3b8",
//                 fontSize: "14px", fontWeight: 700,
//                 cursor: telephone.length === 9 ? "pointer" : "not-allowed",
//                 fontFamily: "inherit",
//                 boxShadow: telephone.length === 9 ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
//                 transition: "all .2s",
//               }}>
//                 💳 Payer {FRAIS_ELECTION} XAF
//               </button>
//             </div>
//           </>
//         )}

//         {/* ── Attente ── */}
//         {etape === "attente" && (
//           <div style={{ textAlign: "center", padding: "8px 0" }}>
//             <div style={{
//               width: "72px", height: "72px", borderRadius: "50%",
//               background: "#eef2ff", border: "3px solid #c7d2fe",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               margin: "0 auto 20px",
//             }}>
//               <FiLoader size={30} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
//             </div>
//             <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e1b4b", marginBottom: "10px" }}>
//               En attente de confirmation
//             </h3>
//             <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6, marginBottom: "20px" }}>
//               Une notification a été envoyée sur votre téléphone.<br />
//               <strong style={{ color: "#6366f1" }}>Entrez votre PIN Mobile Money</strong> pour confirmer.
//             </p>
//             {campayRef && (
//               <div style={{
//                 background: "#f8fafc", borderRadius: "12px", padding: "14px 16px",
//                 border: "1px solid #e2e8f0", marginBottom: "20px",
//               }}>
//                 <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>
//                   Référence
//                 </p>
//                 <p style={{ fontSize: "13px", color: "#475569", fontWeight: 600, margin: 0, wordBreak: "break-all" }}>
//                   {campayRef}
//                 </p>
//               </div>
//             )}
//             <div style={{ height: "4px", background: "#e0e7ff", borderRadius: "4px", overflow: "hidden" }}>
//               <div style={{
//                 height: "100%", width: "40%",
//                 background: "linear-gradient(90deg, #6366f1, #818cf8)",
//                 borderRadius: "4px",
//                 animation: "progress 2s ease-in-out infinite",
//               }} />
//             </div>
//             <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
//               Vérification automatique… (60s max)
//             </p>
//           </div>
//         )}

//         {/* ── Succès ── */}
//         {etape === "succes" && (
//           <div style={{ textAlign: "center", padding: "8px 0" }}>
//             <div style={{
//               width: "72px", height: "72px", borderRadius: "50%",
//               background: "#f0fdf4", border: "3px solid #bbf7d0",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               margin: "0 auto 20px",
//             }}>
//               <FiCheckCircle size={32} color="#22c55e" />
//             </div>
//             <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#15803d", marginBottom: "10px" }}>
//               Paiement confirmé !
//             </h3>
//             <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
//               Votre élection a été créée avec succès et est en attente de validation par le Super Admin.
//             </p>
//             <button onClick={onAnnuler} style={{
//               padding: "12px 28px", borderRadius: "12px",
//               background: "linear-gradient(135deg, #22c55e, #16a34a)",
//               color: "#fff", border: "none", fontSize: "14px", fontWeight: 700,
//               cursor: "pointer", fontFamily: "inherit",
//               boxShadow: "0 4px 14px rgba(34,197,94,0.35)",
//             }}>
//               Voir mes élections →
//             </button>
//           </div>
//         )}

//         {/* ── Erreur ── */}
//         {etape === "erreur" && (
//           <div style={{ textAlign: "center", padding: "8px 0" }}>
//             <div style={{
//               width: "72px", height: "72px", borderRadius: "50%",
//               background: "#fef2f2", border: "3px solid #fecaca",
//               display: "flex", alignItems: "center", justifyContent: "center",
//               margin: "0 auto 20px",
//             }}>
//               <FiXCircle size={32} color="#ef4444" />
//             </div>
//             <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#dc2626", marginBottom: "10px" }}>
//               Paiement échoué
//             </h3>
//             <p style={{ fontSize: "13.5px", color: "#64748b", lineHeight: 1.6, marginBottom: "24px" }}>
//               {msgPaiement || "Le paiement a échoué ou le délai a été dépassé."}
//             </p>
//             <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
//               <button onClick={onAnnuler} style={{
//                 padding: "12px 20px", borderRadius: "12px",
//                 border: "1.5px solid #e2e8f0", background: "#fff",
//                 color: "#64748b", fontSize: "14px", fontWeight: 600,
//                 cursor: "pointer", fontFamily: "inherit",
//               }}>
//                 Fermer
//               </button>
//               <button onClick={onReessayer} style={{
//                 padding: "12px 20px", borderRadius: "12px",
//                 background: "linear-gradient(135deg, #6366f1, #4f46e5)",
//                 color: "#fff", border: "none", fontSize: "14px", fontWeight: 700,
//                 cursor: "pointer", fontFamily: "inherit",
//                 boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
//               }}>
//                 Réessayer
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes progress {
//           0%   { transform: translateX(-100%); }
//           50%  { transform: translateX(150%); }
//           100% { transform: translateX(400%); }
//         }
//       `}</style>
//     </div>
//   );
// }

// // ─── Composant principal ──────────────────────────────────────────────────────
// export default function CreerElection() {
//   const [form, setForm] = useState({
//     title: "", description: "", type: "UNINOMINAL",
//     startDate: "", endDate: "",
//     dureeTourMinutes: 1440, nbSieges: 29,
//     visibilite: "PRIVE", // ← NOUVEAU
//   });
//   const [loading, setLoading] = useState(false);

//   const [etapePaiement, setEtapePaiement] = useState("");
//   const [telephone,     setTelephone]     = useState("");
//   const [campayRef,     setCampayRef]     = useState(null);
//   const [msgPaiement,   setMsgPaiement]   = useState("");

//   const isListe  = form.type === "LISTE";
//   const typeInfo = TYPE_INFO[form.type];

//   const bonusSieges = isListe && form.nbSieges ? Math.floor(form.nbSieges / 2) : 0;
//   const resteSieges = isListe && form.nbSieges ? form.nbSieges - bonusSieges   : 0;

//   const dateFinTour1 = isListe && form.startDate
//     ? (() => {
//         const d = new Date(form.startDate);
//         d.setMinutes(d.getMinutes() + form.dureeTourMinutes);
//         return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
//       })()
//     : null;

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm(prev => ({
//       ...prev,
//       [name]: (name === "dureeTourMinutes" || name === "nbSieges")
//         ? parseInt(value) || 0
//         : value,
//     }));
//   };

//   const handleVisibiliteChange = (val) => {
//     setForm(prev => ({ ...prev, visibilite: val }));
//   };

//   // ÉTAPE 1 : Valider le formulaire
//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!isListe && new Date(form.endDate) <= new Date(form.startDate)) {
//       toast.error("La date de fin doit être postérieure à la date de début.");
//       return;
//     }
//     if (isListe && (!form.nbSieges || form.nbSieges < 1)) {
//       toast.error("Le nombre de sièges doit être supérieur à 0.");
//       return;
//     }

//     setTelephone("");
//     setEtapePaiement("telephone");
//   };

//   // ÉTAPE 2 : Initier le paiement CamPay
//   const handlePayer = async () => {
//     if (!/^[0-9]{9}$/.test(telephone)) {
//       toast.error("Numéro invalide. Saisissez 9 chiffres sans l'indicatif.");
//       return;
//     }

//     setLoading(true);
//     setEtapePaiement("attente");

//     try {
//       const dateDebut = toLocalMySQL(new Date(form.startDate));
//       const dateFin   = isListe
//         ? toLocalMySQL(new Date(new Date(form.startDate).getTime() + form.dureeTourMinutes * 60000))
//         : toLocalMySQL(new Date(form.endDate));

//       const { data } = await api.post("/campay/initier-paiement", {
//         telephone: `237${telephone}`,
//         donnees_election: {
//           titre:            form.title,
//           description:      form.description,
//           type:             form.type,
//           visibilite:       form.visibilite, // ← envoyé au backend
//           startDate:        dateDebut,
//           endDate:          dateFin,
//           dureeTourMinutes: isListe ? form.dureeTourMinutes : null,
//           nbSieges:         isListe ? form.nbSieges         : null,
//         },
//       });

//       setCampayRef(data.campay_reference);
//       setMsgPaiement(data.message);

//       lancerPolling(data.campay_reference);
//     } catch (err) {
//       setMsgPaiement(err.response?.data?.message || "Erreur lors de l'initialisation du paiement.");
//       setEtapePaiement("erreur");
//       setLoading(false);
//     }
//   };

//   const lancerPolling = (reference) => {
//     let tentatives = 0;

//     const interval = setInterval(async () => {
//       tentatives++;
//       try {
//         const { data } = await api.get(`/campay/statut/${reference}`);

//         if (data.status === "SUCCESSFUL") {
//           clearInterval(interval);
//           setEtapePaiement("succes");
//           setLoading(false);
//           toast.success(`🎉 Élection "${form.title}" créée avec succès !`, { autoClose: 6000 });
//           setForm({ title: "", description: "", startDate: "", endDate: "", type: "UNINOMINAL", dureeTourMinutes: 1440, nbSieges: 29, visibilite: "PRIVE" });
//         } else if (data.status === "FAILED" || tentatives >= 12) {
//           clearInterval(interval);
//           setMsgPaiement("Paiement échoué ou délai de 60 secondes dépassé.");
//           setEtapePaiement("erreur");
//           setLoading(false);
//         }
//       } catch {
//         clearInterval(interval);
//         setMsgPaiement("Erreur lors de la vérification du paiement.");
//         setEtapePaiement("erreur");
//         setLoading(false);
//       }
//     }, 5000);
//   };

//   const handleAnnuler   = () => { setEtapePaiement(""); setLoading(false); };
//   const handleReessayer = () => { setEtapePaiement("telephone"); setTelephone(""); };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">
//       <AdminElectionSidebar active="elections" />

//       <ModalPaiement
//         etape={etapePaiement}
//         telephone={telephone}
//         setTelephone={setTelephone}
//         msgPaiement={msgPaiement}
//         campayRef={campayRef}
//         onPayer={handlePayer}
//         onAnnuler={handleAnnuler}
//         onReessayer={handleReessayer}
//       />

//       <main className="flex-1 p-8 overflow-y-auto">
//         {/* En-tête */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h2 className="text-2xl font-black text-indigo-900 tracking-tight">Nouvelle élection</h2>
//             <p className="text-sm text-indigo-400 mt-1">
//               Frais de création :{" "}
//               <strong className="text-indigo-600">{FRAIS_ELECTION} XAF</strong> — payés via Mobile Money
//             </p>
//           </div>
//           <Link
//             to="/admin/adminelection/ElectionPage"
//             className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm font-medium shadow-sm"
//           >
//             <FiArrowLeft size={14} /> Retour
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl">

//           {/* ── Formulaire ── */}
//           <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">

//             {/* Titre */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Titre *
//               </label>
//               <input
//                 type="text" name="title" value={form.title} onChange={handleChange} required
//                 placeholder="Ex : Élection du bureau étudiant 2026"
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//               />
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Description
//               </label>
//               <textarea
//                 name="description" value={form.description} onChange={handleChange} rows="3"
//                 placeholder="Décrivez l'objet de cette élection…"
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
//               />
//             </div>

//             {/* ── SÉLECTEUR VISIBILITÉ ── */}
//             <VisibiliteSelector value={form.visibilite} onChange={handleVisibiliteChange} />

//             {/* Bandeau info PUBLIC */}
//             {form.visibilite === "PUBLIC" && (
//               <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl p-3.5">
//                 <FiGlobe size={13} className="text-sky-600 mt-0.5 flex-shrink-0" />
//                 <p className="text-xs text-sky-700 leading-relaxed">
//                   <strong>Élection publique :</strong> Elle apparaîtra sur la page d'accueil du site.
//                   N'importe qui pourra postuler comme candidat (soumis à votre validation) ou s'inscrire pour voter.
//                 </p>
//               </div>
//             )}

//             {/* Type de scrutin */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Type de scrutin *
//               </label>
//               <select
//                 name="type" value={form.type} onChange={handleChange}
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//               >
//                 <option value="UNINOMINAL">Uninominal</option>
//                 <option value="BINOMINAL">Binominal</option>
//                 <option value="LISTE">Liste (tours successifs)</option>
//               </select>
//             </div>

//             {/* Date début */}
//             <div>
//               <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                 Date et heure de début *
//               </label>
//               <input
//                 type="datetime-local" name="startDate" value={form.startDate}
//                 onChange={handleChange} required
//                 className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//               />
//             </div>

//             {/* Date fin (hors LISTE) */}
//             {!isListe && (
//               <div>
//                 <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
//                   Date et heure de fin *
//                 </label>
//                 <input
//                   type="datetime-local" name="endDate" value={form.endDate}
//                   onChange={handleChange} required
//                   className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//                 />
//               </div>
//             )}

//             {/* Options LISTE */}
//             {isListe && (
//               <div className="space-y-4 pt-1">
//                 <div className="flex items-center gap-2">
//                   <div className="flex-1 h-px bg-indigo-100" />
//                   <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-2">Scrutin de liste</span>
//                   <div className="flex-1 h-px bg-indigo-100" />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
//                       <FiClock size={11} className="text-indigo-500" /> Durée par tour *
//                     </label>
//                     <select
//                       name="dureeTourMinutes" value={form.dureeTourMinutes}
//                       onChange={handleChange} required
//                       className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
//                     >
//                       {DUREE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
//                       <FiUsers size={11} className="text-indigo-500" /> Nombre de sièges *
//                     </label>
//                     <input
//                       type="number" name="nbSieges" value={form.nbSieges}
//                       onChange={handleChange} required min="1" max="999" placeholder="Ex : 29"
//                       className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
//                     />
//                   </div>
//                 </div>

//                 {form.nbSieges > 0 && (
//                   <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5">
//                     <p className="text-xs font-bold text-indigo-500 mb-2.5 flex items-center gap-1.5">
//                       <FiInfo size={11} /> Aperçu de la répartition des sièges
//                     </p>
//                     <div className="grid grid-cols-3 gap-2 text-center">
//                       <div className="bg-white rounded-lg p-2 border border-indigo-100">
//                         <p className="text-lg font-black text-indigo-700">{form.nbSieges}</p>
//                         <p className="text-xs text-gray-400 mt-0.5">Total sièges</p>
//                       </div>
//                       <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
//                         <p className="text-lg font-black text-amber-600">{bonusSieges}</p>
//                         <p className="text-xs text-amber-500 mt-0.5">Bonus gagnant</p>
//                       </div>
//                       <div className="bg-white rounded-lg p-2 border border-indigo-100">
//                         <p className="text-lg font-black text-indigo-500">{resteSieges}</p>
//                         <p className="text-xs text-gray-400 mt-0.5">Répartis proportions</p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {dateFinTour1 && (
//                   <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
//                     <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
//                       <FiCalendar size={11} /> Aperçu du calendrier
//                     </p>
//                     <div className="space-y-1.5 text-xs">
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Début Tour 1</span>
//                         <span className="font-semibold text-indigo-700">
//                           {new Date(form.startDate).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Fin Tour 1</span>
//                         <span className="font-semibold text-indigo-600">{dateFinTour1}</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2">
//                   <FiInfo size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
//                   <p className="text-xs text-amber-700 leading-relaxed">
//                     Si aucune liste n'obtient la majorité absolue (&gt; 50%), un nouveau tour s'ouvre automatiquement.
//                   </p>
//                 </div>
//               </div>
//             )}

//             {/* Bandeau frais CamPay */}
//             <div style={{
//               background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
//               border: "1.5px solid #c7d2fe", borderRadius: "12px",
//               padding: "12px 16px", display: "flex",
//               alignItems: "center", justifyContent: "space-between", gap: "12px",
//             }}>
//               <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//                 <span style={{ fontSize: "20px" }}>💳</span>
//                 <div>
//                   <p style={{ fontSize: "12px", fontWeight: 700, color: "#4338ca", margin: 0 }}>
//                     Frais de création
//                   </p>
//                   <p style={{ fontSize: "11px", color: "#6366f1", margin: 0 }}>
//                     Paiement Mobile Money requis
//                   </p>
//                 </div>
//               </div>
//               <span style={{
//                 fontSize: "16px", fontWeight: 900, color: "#4338ca",
//                 background: "#fff", padding: "4px 12px", borderRadius: "8px",
//                 border: "1px solid #c7d2fe",
//               }}>
//                 {FRAIS_ELECTION} XAF
//               </span>
//             </div>

//             {/* Bouton soumettre */}
//             <div className="pt-2">
//               <button
//                 type="submit" disabled={loading}
//                 className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all w-full justify-center ${
//                   loading
//                     ? "bg-gray-300 cursor-not-allowed"
//                     : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200/60"
//                 }`}
//               >
//                 {loading ? (
//                   <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Traitement…</>
//                 ) : (
//                   <><FiSave size={14} /> Continuer vers le paiement</>
//                 )}
//               </button>
//             </div>
//           </form>

//           {/* ── Panneau latéral ── */}
//           <div className="lg:col-span-2 space-y-4">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//               <img src={Election} alt="Élection" className="w-full object-cover" />
//             </div>

//             {/* Info type scrutin */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Type sélectionné</p>
//               <div className="flex items-start gap-3">
//                 <span className="text-2xl flex-shrink-0">{typeInfo.emoji}</span>
//                 <div>
//                   <p className="font-bold text-gray-800 text-sm">{typeInfo.title}</p>
//                   <p className="text-xs text-gray-500 mt-1 leading-relaxed">{typeInfo.desc}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Info visibilité */}
//             <div className={`rounded-2xl shadow-sm border p-5 ${
//               form.visibilite === "PUBLIC"
//                 ? "bg-sky-50 border-sky-200"
//                 : "bg-white border-gray-200"
//             }`}>
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Mode sélectionné</p>
//               <div className="flex items-start gap-3">
//                 <span className="text-2xl flex-shrink-0">
//                   {form.visibilite === "PUBLIC" ? "🌍" : "🔒"}
//                 </span>
//                 <div>
//                   <p className={`font-bold text-sm ${form.visibilite === "PUBLIC" ? "text-sky-700" : "text-gray-800"}`}>
//                     Élection {form.visibilite === "PUBLIC" ? "Publique" : "Privée"}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1 leading-relaxed">
//                     {form.visibilite === "PUBLIC"
//                       ? "Visible sur la page d'accueil. Candidatures et votes ouverts à tous."
//                       : "Accès restreint. L'admin gère manuellement candidats et électeurs."}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Info paiement */}
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
//               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">💳 Processus de paiement</p>
//               <div className="space-y-3">
//                 {[
//                   { step: "1", text: "Remplissez le formulaire" },
//                   { step: "2", text: "Entrez votre numéro MTN / Orange" },
//                   { step: "3", text: "Confirmez avec votre PIN sur votre téléphone" },
//                   { step: "4", text: "Élection créée automatiquement ✅" },
//                 ].map(({ step, text }) => (
//                   <div key={step} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
//                     <div style={{
//                       width: "22px", height: "22px", borderRadius: "6px",
//                       background: "#eef2ff", color: "#6366f1",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       fontSize: "11px", fontWeight: 800, flexShrink: 0,
//                     }}>
//                       {step}
//                     </div>
//                     <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{text}</p>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       <ToastContainer />
//     </div>
//   );
// }

