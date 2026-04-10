// src/pages/public/CandidaterPublicPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiAlignLeft,
  FiCheckCircle, FiArrowRight, FiArrowLeft,
  FiUpload, FiTrash2, FiImage, FiHome,
} from "react-icons/fi";
import api from "../../services/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─── Navbar commune ─────────────────────────────────────────────────────── */
function PublicNavbar({ showBack = true }) {
  const navigate = useNavigate();
  return (
    <nav style={NAV.root}>
      <div style={NAV.inner}>
        <a href="/" style={NAV.logo}>🗳 <strong>EVote</strong></a>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/" style={NAV.ghost}>
            <FiHome size={13} /> Accueil
          </a>
          {showBack && (
            <button onClick={() => navigate(-1)} style={NAV.ghost}>
              <FiArrowLeft size={13} /> Retour
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ─── Champ générique ────────────────────────────────────────────────────── */
function Field({ icon, label, name, value, onChange, placeholder, type = "text", required = false }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={FORM.fieldGroup}>
      <label style={FORM.label}>{icon} {label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...FORM.input, ...(focused ? FORM.inputFocused : {}) }}
      />
    </div>
  );
}

/* ─── Upload photo ───────────────────────────────────────────────────────── */
function PhotoUpload({ preview, photoFile, onFileChange, onRemove }) {
  const inputRef = useRef(null);
  return (
    <div style={FORM.fieldGroup}>
      <label style={FORM.label}>
        <FiImage size={12} /> Photo de profil{" "}
        <span style={{ color: "#9ca3af", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optionnel)</span>
      </label>

      {preview ? (
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "2px solid #e0e7ff" }}>
          <img src={preview} alt="Aperçu" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 50%)" }} />
          <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <FiImage size={12} color="white" />
            <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{photoFile?.name}</span>
          </div>
          <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
            <button type="button" onClick={() => inputRef.current?.click()} style={BTN.photoAction}>
              <FiUpload size={11} /> Changer
            </button>
            <button type="button" onClick={onRemove} style={BTN.photoRemove}>
              <FiTrash2 size={11} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={FORM.dropzone}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#fafbff"; }}
        >
          <div style={FORM.dropzoneIcon}><FiUpload size={22} color="#6366f1" /></div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#374151" }}>Cliquez pour ajouter votre photo</p>
          <p style={{ margin: 0, fontSize: 11.5, color: "#9ca3af" }}>PNG, JPG, WEBP — max 5 Mo</p>
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

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function CandidaterPublicPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errMsg,   setErrMsg]   = useState("");

  const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "", bio: "" });
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading,    setUploading]    = useState(false);

  useEffect(() => {
    api.get(`/public-elections/${id}/detail`)
      .then(r => setElection(r.data.election))
      .catch(() => setErrMsg("Élection introuvable ou non publique."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrMsg("La photo ne doit pas dépasser 5 Mo."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrMsg("");
  };

  const handlePhotoRemove = () => { setPhotoFile(null); setPhotoPreview(null); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nom || !form.prenom) { setErrMsg("Nom et prénom sont obligatoires."); return; }
    setSending(true);
    setErrMsg("");
    try {
      let photoUrl = null;

      // ✅ FIX : Upload de la photo AVANT de soumettre la candidature
      if (photoFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("photo", photoFile);

        // ✅ FIX : on utilise l'instance api (qui gère le baseURL) plutôt que fetch direct
        const uploadRes = await api.post("/upload/election-photo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // ✅ FIX : on récupère l'URL relative retournée par le backend
        // ex: "/uploads/elections/election-xxx.jpg"
        photoUrl = uploadRes.data.url;
        setUploading(false);
      }

      // ✅ FIX : photo_url envoyé dans le body de la candidature
      await api.post(`/public-elections/${id}/candidater`, {
        ...form,
        photo_url: photoUrl,
      });

      setSuccess(true);
    } catch (err) {
      setErrMsg(err.response?.data?.message || "Une erreur est survenue.");
      setUploading(false);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div style={FULL_CENTER}>
      <div style={SPINNER} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <>
      <style>{BASE_STYLES}</style>
      <div style={PAGE.root}>
        <div style={PAGE.orb1} />
        <div style={PAGE.orb2} />
        <PublicNavbar />

        <main style={PAGE.main}>
          <AnimatePresence mode="wait">
            {success ? (
              /* ── SUCCÈS ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ ...CARD.root, textAlign: "center", padding: "60px 40px" }}
              >
                <div style={CARD.successIcon}><FiCheckCircle size={40} color="#22c55e" /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
                  Candidature soumise !
                </h2>
                <div style={{
                  background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14,
                  padding: "16px 18px", marginBottom: 28, textAlign: "left",
                  maxWidth: 420, margin: "0 auto 28px",
                }}>
                  <p style={{ fontSize: 13.5, color: "#166534", lineHeight: 1.75, margin: 0 }}>
                    ✅ <strong>Votre candidature à l'élection « {election?.titre} » a bien été enregistrée.</strong>
                    <br /><br />
                    ⏳ Elle sera examinée par l'administrateur avant d'être visible par les électeurs.
                    <br /><br />
                    📧 Vous recevrez un <strong>e-mail de confirmation</strong> dès son approbation.
                  </p>
                </div>
                <button onClick={() => navigate("/")} style={BTN.success}>
                  <FiHome size={15} /> Retour à l'accueil
                </button>
              </motion.div>
            ) : (
              /* ── FORMULAIRE ── */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
                style={CARD.root}
              >
                {/* Header card */}
                <div style={CARD.header}>
                  <span style={CARD.badge}>🌐 Élection publique</span>
                  <h1 style={CARD.title}>Déposer une candidature</h1>
                  {election && (
                    <div style={CARD.electionInfo}>
                      <strong>{election.titre}</strong>
                      {election.description && (
                        <span>{election.description.slice(0, 120)}{election.description.length > 120 ? "…" : ""}</span>
                      )}
                    </div>
                  )}
                </div>

                {errMsg && <div style={FORM.error}>{errMsg}</div>}

                <form onSubmit={handleSubmit} style={FORM.root}>

                  {/* 01 — Identité */}
                  <div style={FORM.sectionLabel}>
                    <span style={FORM.sectionNum}>01</span>
                    <span>Votre identité</span>
                  </div>
                  <div style={FORM.grid2}>
                    <Field icon={<FiUser size={13}/>}  label="Nom *"    name="nom"    value={form.nom}    onChange={handleChange} placeholder="Votre nom"    required />
                    <Field icon={<FiUser size={13}/>}  label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Votre prénom" required />
                  </div>
                  <div style={FORM.grid2}>
                    <Field icon={<FiMail size={13}/>}  label="Email"     name="email"     type="email" value={form.email}     onChange={handleChange} placeholder="nom@email.com" />
                    <Field icon={<FiPhone size={13}/>} label="Téléphone" name="telephone"              value={form.telephone} onChange={handleChange} placeholder="6XXXXXXXX" />
                  </div>

                  {/* 02 — Photo */}
                  <div style={{ ...FORM.sectionLabel, marginTop: 4 }}>
                    <span style={FORM.sectionNum}>02</span>
                    <span>Photo de profil</span>
                  </div>
                  <PhotoUpload
                    preview={photoPreview}
                    photoFile={photoFile}
                    onFileChange={handlePhotoChange}
                    onRemove={handlePhotoRemove}
                  />

                  {/* 03 — Présentation */}
                  <div style={{ ...FORM.sectionLabel, marginTop: 4 }}>
                    <span style={FORM.sectionNum}>03</span>
                    <span>Votre présentation</span>
                  </div>
                  <div style={FORM.fieldGroup}>
                    <label style={FORM.label}><FiAlignLeft size={12}/> Bio / Programme</label>
                    <textarea
                      name="bio" value={form.bio} onChange={handleChange} rows={4}
                      placeholder="Décrivez votre programme, vos motivations…"
                      style={{ ...FORM.input, resize: "none", minHeight: 100, lineHeight: 1.6 }}
                    />
                  </div>

                  <div style={FORM.infoBox}>
                    ℹ️ Votre candidature sera examinée par l'administrateur avant d'être visible par les électeurs.
                  </div>

                  <button
                    type="submit" disabled={sending}
                    style={{ ...BTN.submit, opacity: sending ? .75 : 1, cursor: sending ? "not-allowed" : "pointer" }}
                  >
                    {sending ? (
                      <>
                        <div style={{ ...SPINNER, width: 16, height: 16 }} />
                        {uploading ? "Upload de la photo…" : "Envoi en cours…"}
                      </>
                    ) : (
                      <>Soumettre ma candidature <FiArrowRight size={15} /></>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}

/* ─── Design tokens ──────────────────────────────────────────────────────── */
const NAV = {
  root:  { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "relative", zIndex: 10 },
  inner: { maxWidth: 800, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo:  { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
  ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
};
const PAGE = {
  root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)", position: "relative", overflowX: "hidden" },
  orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", top: -180, left: -180 },
  orb2: { position: "fixed", width: 360, height: 360, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%)", bottom: -100, right: -80 },
  main: { position: "relative", zIndex: 1, padding: "48px 24px 80px", display: "flex", justifyContent: "center" },
};
const CARD = {
  root:        { width: "100%", maxWidth: 680, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(99,102,241,0.13)", borderRadius: 24, boxShadow: "0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10)", overflow: "hidden" },
  header:      { background: "linear-gradient(135deg,#4f46e5,#6366f1)", padding: "32px 36px", color: "white" },
  badge:       { display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: .5, marginBottom: 12 },
  title:       { fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 14 },
  electionInfo:{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 },
  successIcon: { width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
};
const FORM = {
  root:         { padding: "28px 36px", display: "flex", flexDirection: "column", gap: 18 },
  error:        { margin: "20px 36px 0", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 600 },
  sectionLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: .7, paddingBottom: 10, borderBottom: "1px solid #eef2ff" },
  sectionNum:   { background: "#6366f1", color: "white", width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 },
  grid2:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  fieldGroup:   { display: "flex", flexDirection: "column", gap: 6 },
  label:        { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: .6 },
  input:        { width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'Outfit',sans-serif", color: "#1e293b", background: "#fafafa", outline: "none", transition: "border-color .2s,box-shadow .2s,background .2s", boxSizing: "border-box" },
  inputFocused: { borderColor: "#818cf8", boxShadow: "0 0 0 3px rgba(99,102,241,0.12)", background: "white" },
  infoBox:      { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#92400e", lineHeight: 1.6 },
  dropzone:     { border: "2px dashed #c7d2fe", borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "#fafbff", transition: "all .2s" },
  dropzoneIcon: { width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
};
const BTN = {
  submit:      { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)", transition: "all .2s" },
  success:     { display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: "pointer", boxShadow: "0 4px 14px rgba(34,197,94,0.35)" },
  photoAction: { padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "none", color: "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
  photoRemove: { padding: "5px 10px", borderRadius: 8, background: "rgba(239,68,68,0.9)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
};
const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
const SPINNER = { width: 36, height: 36, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" };
const BASE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @media(max-width:600px){
    .cp-grid-2{grid-template-columns:1fr!important;}
  }
`;
































// // src/pages/public/CandidaterPublicPage.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUser, FiMail, FiPhone, FiAlignLeft,
//   FiCheckCircle, FiArrowRight, FiArrowLeft,
//   FiUpload, FiTrash2, FiImage, FiHome,
// } from "react-icons/fi";
// import api from "../../services/api";

// // ✅ FIX : API_BASE pour prévisualisation cohérente
// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// /* ─── Navbar commune ─────────────────────────────────────────────────────── */
// function PublicNavbar({ showBack = true }) {
//   const navigate = useNavigate();
//   return (
//     <nav style={NAV.root}>
//       <div style={NAV.inner}>
//         <a href="/" style={NAV.logo}>🗳 <strong>EVote</strong></a>
//         <div style={{ display: "flex", gap: 8 }}>
//           <a href="/" style={NAV.ghost}>
//             <FiHome size={13} /> Accueil
//           </a>
//           {showBack && (
//             <button onClick={() => navigate(-1)} style={NAV.ghost}>
//               <FiArrowLeft size={13} /> Retour
//             </button>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }

// /* ─── Champ générique ────────────────────────────────────────────────────── */
// function Field({ icon, label, name, value, onChange, placeholder, type = "text", required = false }) {
//   const [focused, setFocused] = useState(false);
//   return (
//     <div style={FORM.fieldGroup}>
//       <label style={FORM.label}>{icon} {label}</label>
//       <input
//         type={type} name={name} value={value} onChange={onChange}
//         placeholder={placeholder} required={required}
//         onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
//         style={{ ...FORM.input, ...(focused ? FORM.inputFocused : {}) }}
//       />
//     </div>
//   );
// }

// /* ─── Upload photo ───────────────────────────────────────────────────────── */
// function PhotoUpload({ preview, photoFile, onFileChange, onRemove, setErrMsg }) {
//   const inputRef = useRef(null);
//   return (
//     <div style={FORM.fieldGroup}>
//       <label style={FORM.label}>
//         <FiImage size={12} /> Photo de profil{" "}
//         <span style={{ color: "#9ca3af", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optionnel)</span>
//       </label>

//       {preview ? (
//         <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "2px solid #e0e7ff" }}>
//           <img src={preview} alt="Aperçu" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
//           <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 50%)" }} />
//           <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6 }}>
//             <FiImage size={12} color="white" />
//             <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{photoFile?.name}</span>
//           </div>
//           <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
//             <button type="button" onClick={() => inputRef.current?.click()} style={BTN.photoAction}>
//               <FiUpload size={11} /> Changer
//             </button>
//             <button type="button" onClick={onRemove} style={BTN.photoRemove}>
//               <FiTrash2 size={11} />
//             </button>
//           </div>
//         </div>
//       ) : (
//         <div
//           onClick={() => inputRef.current?.click()}
//           style={FORM.dropzone}
//           onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
//           onMouseLeave={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#fafbff"; }}
//         >
//           <div style={FORM.dropzoneIcon}><FiUpload size={22} color="#6366f1" /></div>
//           <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#374151" }}>Cliquez pour ajouter votre photo</p>
//           <p style={{ margin: 0, fontSize: 11.5, color: "#9ca3af" }}>PNG, JPG, WEBP — max 5 Mo</p>
//         </div>
//       )}
//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/png,image/jpeg,image/webp,image/gif"
//         style={{ display: "none" }}
//         onChange={onFileChange}
//       />
//     </div>
//   );
// }

// /* ─── Page principale ────────────────────────────────────────────────────── */
// export default function CandidaterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [election, setElection] = useState(null);
//   const [loading,  setLoading]  = useState(true);
//   const [sending,  setSending]  = useState(false);
//   const [success,  setSuccess]  = useState(false);
//   const [errMsg,   setErrMsg]   = useState("");

//   const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "", bio: "" });
//   const [photoFile,    setPhotoFile]    = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [uploading,    setUploading]    = useState(false);

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setElection(r.data.election))
//       .catch(() => setErrMsg("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

//   const handlePhotoChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.size > 5 * 1024 * 1024) { setErrMsg("La photo ne doit pas dépasser 5 Mo."); return; }
//     setPhotoFile(file);
//     setPhotoPreview(URL.createObjectURL(file));
//     setErrMsg("");
//   };

//   const handlePhotoRemove = () => { setPhotoFile(null); setPhotoPreview(null); };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (!form.nom || !form.prenom) { setErrMsg("Nom et prénom sont obligatoires."); return; }
//     setSending(true);
//     setErrMsg("");
//     try {
//       let photoUrl = null;
//       if (photoFile) {
//         setUploading(true);
//         const fd = new FormData();
//         fd.append("photo", photoFile);
//         const uploadRes = await api.post("/upload/election-photo", fd, {
//           headers: { "Content-Type": "multipart/form-data" },
//         });
//         // ✅ FIX : on stocke l'URL relative retournée par le backend
//         // ex: "/uploads/elections/election-xxx.jpg"
//         // buildPhotoUrl() dans les autres pages s'occupera de préfixer API_BASE
//         photoUrl = uploadRes.data.url;
//         setUploading(false);
//       }
//       await api.post(`/public-elections/${id}/candidater`, {
//         ...form,
//         photo_url: photoUrl,
//       });
//       setSuccess(true);
//     } catch (err) {
//       setErrMsg(err.response?.data?.message || "Une erreur est survenue.");
//       setUploading(false);
//     } finally {
//       setSending(false);
//     }
//   };

//   if (loading) return (
//     <div style={FULL_CENTER}>
//       <div style={SPINNER} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   return (
//     <>
//       <style>{BASE_STYLES}</style>
//       <div style={PAGE.root}>
//         <div style={PAGE.orb1} />
//         <div style={PAGE.orb2} />
//         <PublicNavbar />

//         <main style={PAGE.main}>
//           <AnimatePresence mode="wait">
//             {success ? (
//               /* ── SUCCÈS ── */
//               <motion.div
//                 key="success"
//                 initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
//                 style={{ ...CARD.root, textAlign: "center", padding: "60px 40px" }}
//               >
//                 <div style={CARD.successIcon}><FiCheckCircle size={40} color="#22c55e" /></div>
//                 <h2 style={{ fontSize: 24, fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
//                   Candidature soumise !
//                 </h2>
//                 <div style={{
//                   background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14,
//                   padding: "16px 18px", marginBottom: 28, textAlign: "left",
//                   maxWidth: 420, margin: "0 auto 28px",
//                 }}>
//                   <p style={{ fontSize: 13.5, color: "#166534", lineHeight: 1.75, margin: 0 }}>
//                     ✅ <strong>Votre candidature à l'élection « {election?.titre} » a bien été enregistrée.</strong>
//                     <br /><br />
//                     ⏳ Elle sera examinée par l'administrateur avant d'être visible par les électeurs.
//                     <br /><br />
//                     📧 Vous recevrez un <strong>e-mail de confirmation</strong> dès son approbation.
//                   </p>
//                 </div>
//                 <button onClick={() => navigate("/")} style={BTN.success}>
//                   <FiHome size={15} /> Retour à l'accueil
//                 </button>
//               </motion.div>
//             ) : (
//               /* ── FORMULAIRE ── */
//               <motion.div
//                 key="form"
//                 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
//                 style={CARD.root}
//               >
//                 {/* Header card */}
//                 <div style={CARD.header}>
//                   <span style={CARD.badge}>🌐 Élection publique</span>
//                   <h1 style={CARD.title}>Déposer une candidature</h1>
//                   {election && (
//                     <div style={CARD.electionInfo}>
//                       <strong>{election.titre}</strong>
//                       {election.description && (
//                         <span>{election.description.slice(0, 120)}{election.description.length > 120 ? "…" : ""}</span>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {errMsg && <div style={FORM.error}>{errMsg}</div>}

//                 <form onSubmit={handleSubmit} style={FORM.root}>

//                   {/* 01 — Identité */}
//                   <div style={FORM.sectionLabel}>
//                     <span style={FORM.sectionNum}>01</span>
//                     <span>Votre identité</span>
//                   </div>
//                   <div style={FORM.grid2}>
//                     <Field icon={<FiUser size={13}/>}  label="Nom *"    name="nom"    value={form.nom}    onChange={handleChange} placeholder="Votre nom"    required />
//                     <Field icon={<FiUser size={13}/>}  label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Votre prénom" required />
//                   </div>
//                   <div style={FORM.grid2}>
//                     <Field icon={<FiMail size={13}/>}  label="Email"     name="email"     type="email" value={form.email}     onChange={handleChange} placeholder="nom@email.com" />
//                     <Field icon={<FiPhone size={13}/>} label="Téléphone" name="telephone"              value={form.telephone} onChange={handleChange} placeholder="6XXXXXXXX" />
//                   </div>

//                   {/* 02 — Photo */}
//                   <div style={{ ...FORM.sectionLabel, marginTop: 4 }}>
//                     <span style={FORM.sectionNum}>02</span>
//                     <span>Photo de profil</span>
//                   </div>
//                   <PhotoUpload
//                     preview={photoPreview}
//                     photoFile={photoFile}
//                     onFileChange={handlePhotoChange}
//                     onRemove={handlePhotoRemove}
//                     setErrMsg={setErrMsg}
//                   />

//                   {/* 03 — Présentation */}
//                   <div style={{ ...FORM.sectionLabel, marginTop: 4 }}>
//                     <span style={FORM.sectionNum}>03</span>
//                     <span>Votre présentation</span>
//                   </div>
//                   <div style={FORM.fieldGroup}>
//                     <label style={FORM.label}><FiAlignLeft size={12}/> Bio / Programme</label>
//                     <textarea
//                       name="bio" value={form.bio} onChange={handleChange} rows={4}
//                       placeholder="Décrivez votre programme, vos motivations…"
//                       style={{ ...FORM.input, resize: "none", minHeight: 100, lineHeight: 1.6 }}
//                     />
//                   </div>

//                   <div style={FORM.infoBox}>
//                     ℹ️ Votre candidature sera examinée par l'administrateur avant d'être visible par les électeurs.
//                   </div>

//                   <button
//                     type="submit" disabled={sending}
//                     style={{ ...BTN.submit, opacity: sending ? .75 : 1, cursor: sending ? "not-allowed" : "pointer" }}
//                   >
//                     {sending ? (
//                       <>
//                         <div style={{ ...SPINNER, width: 16, height: 16 }} />
//                         {uploading ? "Upload de la photo…" : "Envoi en cours…"}
//                       </>
//                     ) : (
//                       <>Soumettre ma candidature <FiArrowRight size={15} /></>
//                     )}
//                   </button>
//                 </form>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </main>
//       </div>
//     </>
//   );
// }

// /* ─── Design tokens ──────────────────────────────────────────────────────── */
// const NAV = {
//   root:  { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "relative", zIndex: 10 },
//   inner: { maxWidth: 800, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
//   logo:  { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
//   ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
// };
// const PAGE = {
//   root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)", position: "relative", overflowX: "hidden" },
//   orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", top: -180, left: -180 },
//   orb2: { position: "fixed", width: 360, height: 360, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%)", bottom: -100, right: -80 },
//   main: { position: "relative", zIndex: 1, padding: "48px 24px 80px", display: "flex", justifyContent: "center" },
// };
// const CARD = {
//   root:        { width: "100%", maxWidth: 680, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(99,102,241,0.13)", borderRadius: 24, boxShadow: "0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10)", overflow: "hidden" },
//   header:      { background: "linear-gradient(135deg,#4f46e5,#6366f1)", padding: "32px 36px", color: "white" },
//   badge:       { display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: .5, marginBottom: 12 },
//   title:       { fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 14 },
//   electionInfo:{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 },
//   successIcon: { width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
// };
// const FORM = {
//   root:         { padding: "28px 36px", display: "flex", flexDirection: "column", gap: 18 },
//   error:        { margin: "20px 36px 0", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 600 },
//   sectionLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: .7, paddingBottom: 10, borderBottom: "1px solid #eef2ff" },
//   sectionNum:   { background: "#6366f1", color: "white", width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 },
//   grid2:        { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
//   fieldGroup:   { display: "flex", flexDirection: "column", gap: 6 },
//   label:        { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: .6 },
//   input:        { width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'Outfit',sans-serif", color: "#1e293b", background: "#fafafa", outline: "none", transition: "border-color .2s,box-shadow .2s,background .2s", boxSizing: "border-box" },
//   inputFocused: { borderColor: "#818cf8", boxShadow: "0 0 0 3px rgba(99,102,241,0.12)", background: "white" },
//   infoBox:      { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#92400e", lineHeight: 1.6 },
//   dropzone:     { border: "2px dashed #c7d2fe", borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "#fafbff", transition: "all .2s" },
//   dropzoneIcon: { width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
// };
// const BTN = {
//   submit:      { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)", transition: "all .2s" },
//   success:     { display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: "pointer", boxShadow: "0 4px 14px rgba(34,197,94,0.35)" },
//   photoAction: { padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "none", color: "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
//   photoRemove: { padding: "5px 10px", borderRadius: 8, background: "rgba(239,68,68,0.9)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
// };
// const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
// const SPINNER = { width: 36, height: 36, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" };
// const BASE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   textarea.field-input{resize:none;}
//   @media(max-width:600px){
//     .cp-grid-2{grid-template-columns:1fr!important;}
//   }
// `;


















































// // src/pages/public/CandidaterPublicPage.jsx
// import React, { useState, useEffect, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUser, FiMail, FiPhone, FiAlignLeft,
//   FiCheckCircle, FiArrowRight, FiArrowLeft, FiLoader,
//   FiUpload, FiTrash2, FiImage, FiHome,
// } from "react-icons/fi";
// import api from "../../services/api";

// /* ─── Navbar commune ─────────────────────────────────────────────────────── */
// function PublicNavbar({ showBack = true }) {
//   const navigate = useNavigate();
//   return (
//     <nav style={NAV.root}>
//       <div style={NAV.inner}>
//         <a href="/" style={NAV.logo}>🗳 <strong>EVote</strong></a>
//         <div style={{ display: "flex", gap: 8 }}>
//           <a href="/" style={NAV.ghost}>
//             <FiHome size={13} /> Accueil
//           </a>
//           {showBack && (
//             <button onClick={() => navigate(-1)} style={NAV.ghost}>
//               <FiArrowLeft size={13} /> Retour
//             </button>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }

// /* ─── Champ générique ────────────────────────────────────────────────────── */
// function Field({ icon, label, name, value, onChange, placeholder, type = "text", required = false }) {
//   const [focused, setFocused] = useState(false);
//   return (
//     <div style={FORM.fieldGroup}>
//       <label style={FORM.label}>{icon} {label}</label>
//       <input
//         type={type} name={name} value={value} onChange={onChange}
//         placeholder={placeholder} required={required}
//         onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
//         style={{
//           ...FORM.input,
//           ...(focused ? FORM.inputFocused : {}),
//         }}
//       />
//     </div>
//   );
// }

// /* ─── Upload photo ───────────────────────────────────────────────────────── */
// function PhotoUpload({ preview, photoFile, onFileChange, onRemove, errMsg, setErrMsg }) {
//   const inputRef = useRef(null);
//   return (
//     <div style={FORM.fieldGroup}>
//       <label style={FORM.label}>
//         <FiImage size={12} /> Photo de profil{" "}
//         <span style={{ color: "#9ca3af", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optionnel)</span>
//       </label>

//       {preview ? (
//         <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "2px solid #e0e7ff" }}>
//           <img src={preview} alt="Aperçu" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
//           <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.5) 0%,transparent 50%)" }} />
//           <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 6 }}>
//             <FiImage size={12} color="white" />
//             <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{photoFile?.name}</span>
//           </div>
//           <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 6 }}>
//             <button type="button" onClick={() => inputRef.current?.click()} style={BTN.photoAction}>
//               <FiUpload size={11} /> Changer
//             </button>
//             <button type="button" onClick={onRemove} style={BTN.photoRemove}>
//               <FiTrash2 size={11} />
//             </button>
//           </div>
//         </div>
//       ) : (
//         <div
//           onClick={() => inputRef.current?.click()}
//           style={FORM.dropzone}
//           onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
//           onMouseLeave={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#fafbff"; }}
//         >
//           <div style={FORM.dropzoneIcon}><FiUpload size={22} color="#6366f1" /></div>
//           <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#374151" }}>Cliquez pour ajouter votre photo</p>
//           <p style={{ margin: 0, fontSize: 11.5, color: "#9ca3af" }}>PNG, JPG, WEBP — max 5 Mo</p>
//         </div>
//       )}
//       <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: "none" }} onChange={onFileChange} />
//     </div>
//   );
// }

// /* ─── Page principale ────────────────────────────────────────────────────── */
// export default function CandidaterPublicPage() {
//   const { id }   = useParams();
//   const navigate = useNavigate();

//   const [election, setElection] = useState(null);
//   const [loading,  setLoading]  = useState(true);
//   const [sending,  setSending]  = useState(false);
//   const [success,  setSuccess]  = useState(false);
//   const [errMsg,   setErrMsg]   = useState("");

//   const [form, setForm] = useState({ nom: "", prenom: "", email: "", telephone: "", bio: "" });
//   const [photoFile,    setPhotoFile]    = useState(null);
//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [uploading,    setUploading]    = useState(false);

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setElection(r.data.election))
//       .catch(() => setErrMsg("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

//   const handlePhotoChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     if (file.size > 5 * 1024 * 1024) { setErrMsg("La photo ne doit pas dépasser 5 Mo."); return; }
//     setPhotoFile(file);
//     setPhotoPreview(URL.createObjectURL(file));
//     setErrMsg("");
//   };

//   const handlePhotoRemove = () => { setPhotoFile(null); setPhotoPreview(null); };

//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (!form.nom || !form.prenom) { setErrMsg("Nom et prénom sont obligatoires."); return; }
//     setSending(true);
//     setErrMsg("");
//     try {
//       let photoUrl = null;
//       if (photoFile) {
//         setUploading(true);
//         const fd = new FormData();
//         fd.append("photo", photoFile);
//         const uploadRes = await api.post("/upload/election-photo", fd, { headers: { "Content-Type": "multipart/form-data" } });
//         photoUrl = uploadRes.data.url;
//         setUploading(false);
//       }
//       await api.post(`/public-elections/${id}/candidater`, { ...form, photo_url: photoUrl });
//       setSuccess(true);
//     } catch (err) {
//       setErrMsg(err.response?.data?.message || "Une erreur est survenue.");
//       setUploading(false);
//     } finally {
//       setSending(false);
//     }
//   };

//   if (loading) return (
//     <div style={FULL_CENTER}>
//       <div style={SPINNER} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   return (
//     <>
//       <style>{BASE_STYLES}</style>
//       <div style={PAGE.root}>
//         <div style={PAGE.orb1} />
//         <div style={PAGE.orb2} />
//         <PublicNavbar />

//         <main style={PAGE.main}>
//           <AnimatePresence mode="wait">
//             {success ? (
//               /* ── SUCCÈS ── */
//               <motion.div key="success" initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}
//                 style={{ ...CARD.root, textAlign: "center", padding: "60px 40px" }}>
//                 <div style={CARD.successIcon}><FiCheckCircle size={40} color="#22c55e" /></div>
//                 <h2 style={{ fontSize: 24, fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
//                   Candidature soumise !
//                 </h2>
//                 {/* Message explicatif — cohérent avec RegisterElection */}
//                 <div style={{
//                   background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 14,
//                   padding: "16px 18px", marginBottom: 28, textAlign: "left",
//                   maxWidth: 420, margin: "0 auto 28px",
//                 }}>
//                   <p style={{ fontSize: 13.5, color: "#166534", lineHeight: 1.75, margin: 0 }}>
//                     ✅ <strong>Votre candidature à l'élection « {election?.titre} » a bien été enregistrée.</strong>
//                     <br /><br />
//                     ⏳ Elle sera examinée par l'administrateur avant d'être visible par les électeurs.
//                     <br /><br />
//                     📧 Vous recevrez un <strong>e-mail de confirmation</strong> dès son approbation.
//                   </p>
//                 </div>
//                 <button onClick={() => navigate("/")} style={BTN.success}>
//                   <FiHome size={15} /> Retour à l'accueil
//                 </button>
//               </motion.div>
//             ) : (
//               /* ── FORMULAIRE ── */
//               <motion.div key="form" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }} style={CARD.root}>

//                 {/* Header card */}
//                 <div style={CARD.header}>
//                   <span style={CARD.badge}>🌐 Élection publique</span>
//                   <h1 style={CARD.title}>Déposer une candidature</h1>
//                   {election && (
//                     <div style={CARD.electionInfo}>
//                       <strong>{election.titre}</strong>
//                       {election.description && (
//                         <span>{election.description.slice(0, 120)}{election.description.length > 120 ? "…" : ""}</span>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {errMsg && <div style={FORM.error}>{errMsg}</div>}

//                 <form onSubmit={handleSubmit} style={FORM.root}>

//                   {/* 01 — Identité */}
//                   <div style={FORM.sectionLabel}>
//                     <span style={FORM.sectionNum}>01</span>
//                     <span>Votre identité</span>
//                   </div>
//                   <div style={FORM.grid2}>
//                     <Field icon={<FiUser size={13}/>} label="Nom *"    name="nom"    value={form.nom}    onChange={handleChange} placeholder="Votre nom"    required />
//                     <Field icon={<FiUser size={13}/>} label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Votre prénom" required />
//                   </div>
//                   <div style={FORM.grid2}>
//                     <Field icon={<FiMail size={13}/>}  label="Email"     name="email"     type="email" value={form.email}     onChange={handleChange} placeholder="nom@email.com" />
//                     <Field icon={<FiPhone size={13}/>} label="Téléphone" name="telephone"              value={form.telephone} onChange={handleChange} placeholder="6XXXXXXXX" />
//                   </div>

//                   {/* 02 — Photo */}
//                   <div style={{ ...FORM.sectionLabel, marginTop: 4 }}>
//                     <span style={FORM.sectionNum}>02</span>
//                     <span>Photo de profil</span>
//                   </div>
//                   <PhotoUpload
//                     preview={photoPreview} photoFile={photoFile}
//                     onFileChange={handlePhotoChange} onRemove={handlePhotoRemove}
//                     errMsg={errMsg} setErrMsg={setErrMsg}
//                   />

//                   {/* 03 — Présentation */}
//                   <div style={{ ...FORM.sectionLabel, marginTop: 4 }}>
//                     <span style={FORM.sectionNum}>03</span>
//                     <span>Votre présentation</span>
//                   </div>
//                   <div style={FORM.fieldGroup}>
//                     <label style={FORM.label}><FiAlignLeft size={12}/> Bio / Programme</label>
//                     <textarea
//                       name="bio" value={form.bio} onChange={handleChange} rows={4}
//                       placeholder="Décrivez votre programme, vos motivations…"
//                       style={{ ...FORM.input, resize: "none", minHeight: 100, lineHeight: 1.6 }}
//                     />
//                   </div>

//                   <div style={FORM.infoBox}>
//                     ℹ️ Votre candidature sera examinée par l'administrateur avant d'être visible par les électeurs.
//                   </div>

//                   <button type="submit" disabled={sending} style={{ ...BTN.submit, opacity: sending ? .75 : 1, cursor: sending ? "not-allowed" : "pointer" }}>
//                     {sending ? (
//                       <>
//                         <div style={{ ...SPINNER, width: 16, height: 16 }} />
//                         {uploading ? "Upload de la photo…" : "Envoi en cours…"}
//                       </>
//                     ) : (
//                       <>Soumettre ma candidature <FiArrowRight size={15} /></>
//                     )}
//                   </button>
//                 </form>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </main>
//       </div>
//     </>
//   );
// }

// /* ─── Design tokens ──────────────────────────────────────────────────────── */
// const NAV = {
//   root: { background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 1px 16px rgba(0,0,0,0.05)", position: "relative", zIndex: 10 },
//   inner: { maxWidth: 800, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" },
//   logo: { display: "flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 18, fontWeight: 700, color: "#4f46e5" },
//   ghost: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none", fontFamily: "inherit", transition: "all .15s" },
// };

// const PAGE = {
//   root: { minHeight: "100vh", fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%)", position: "relative", overflowX: "hidden" },
//   orb1: { position: "fixed", width: 500, height: 500, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)", top: -180, left: -180 },
//   orb2: { position: "fixed", width: 360, height: 360, borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 0, background: "radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%)", bottom: -100, right: -80 },
//   main: { position: "relative", zIndex: 1, padding: "48px 24px 80px", display: "flex", justifyContent: "center" },
// };

// const CARD = {
//   root: { width: "100%", maxWidth: 680, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", border: "1px solid rgba(99,102,241,0.13)", borderRadius: 24, boxShadow: "0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10)", overflow: "hidden" },
//   header: { background: "linear-gradient(135deg,#4f46e5,#6366f1)", padding: "32px 36px", color: "white" },
//   badge: { display: "inline-block", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: .5, marginBottom: 12 },
//   title: { fontSize: 26, fontWeight: 900, letterSpacing: -0.5, marginBottom: 14 },
//   electionInfo: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 4 },
//   successIcon: { width: 80, height: 80, borderRadius: "50%", background: "#f0fdf4", border: "3px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
// };

// const FORM = {
//   root: { padding: "28px 36px", display: "flex", flexDirection: "column", gap: 18 },
//   error: { margin: "20px 36px 0", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 600 },
//   sectionLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: .7, paddingBottom: 10, borderBottom: "1px solid #eef2ff" },
//   sectionNum: { background: "#6366f1", color: "white", width: 20, height: 20, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 },
//   grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
//   fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
//   label: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: .6 },
//   input: { width: "100%", padding: "11px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "'Outfit',sans-serif", color: "#1e293b", background: "#fafafa", outline: "none", transition: "border-color .2s,box-shadow .2s,background .2s", boxSizing: "border-box" },
//   inputFocused: { borderColor: "#818cf8", boxShadow: "0 0 0 3px rgba(99,102,241,0.12)", background: "white" },
//   infoBox: { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#92400e", lineHeight: 1.6 },
//   dropzone: { border: "2px dashed #c7d2fe", borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer", background: "#fafbff", transition: "all .2s" },
//   dropzoneIcon: { width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" },
// };

// const BTN = {
//   submit: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", boxShadow: "0 4px 14px rgba(79,70,229,0.35)", transition: "all .2s" },
//   success: { display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: "pointer", boxShadow: "0 4px 14px rgba(34,197,94,0.35)" },
//   photoAction: { padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "none", color: "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
//   photoRemove: { padding: "5px 10px", borderRadius: 8, background: "rgba(239,68,68,0.9)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 },
// };

// const FULL_CENTER = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, fontFamily: "'Outfit',sans-serif", background: "linear-gradient(135deg,#eef2ff 0%,#f8f9ff 100%)" };
// const SPINNER = { width: 36, height: 36, border: "4px solid #e0e7ff", borderTop: "4px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" };

// const BASE_STYLES = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   textarea.field-input{resize:none;}
//   @media(max-width:600px){
//     .cp-grid-2{grid-template-columns:1fr!important;}
//   }
// `;


