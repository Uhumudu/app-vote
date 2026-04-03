// src/pages/public/CandidaterPublicPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiMail, FiPhone, FiAlignLeft,
  FiCheckCircle, FiArrowRight, FiArrowLeft, FiLoader,
  FiUpload, FiTrash2, FiImage,
} from "react-icons/fi";
import api from "../../services/api";

export default function CandidaterPublicPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [election, setElection] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [errMsg,   setErrMsg]   = useState("");

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "", telephone: "", bio: "",
  });

  // Photo
  const [photoFile,    setPhotoFile]    = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading,    setUploading]    = useState(false);
  const inputRef = useRef(null);

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
    if (file.size > 5 * 1024 * 1024) {
      setErrMsg("La photo ne doit pas dépasser 5 Mo.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrMsg("");
  };

  const handlePhotoRemove = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nom || !form.prenom) {
      setErrMsg("Nom et prénom sont obligatoires.");
      return;
    }
    setSending(true);
    setErrMsg("");

    try {
      // 1. Upload photo si présente
      let photoUrl = null;
      if (photoFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("photo", photoFile);
        const uploadRes = await api.post("/upload/election-photo", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photoUrl = uploadRes.data.url;
        setUploading(false);
      }

      // 2. Soumettre la candidature avec la photo
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
    <div style={FULLCENTER}>
      <FiLoader size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="cp-root">
        <div className="cp-orb cp-orb-1" />
        <div className="cp-orb cp-orb-2" />

        {/* Navbar */}
        <nav className="cp-nav">
          <div className="cp-nav-inner">
            <a href="/" className="cp-logo">🗳 <strong>EVote</strong></a>
            <button onClick={() => navigate(-1)} className="cp-back">
              <FiArrowLeft size={14} /> Retour
            </button>
          </div>
        </nav>

        <main className="cp-main">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: .9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="cp-card"
                style={{ textAlign: "center", padding: "60px 40px" }}
              >
                <div className="cp-success-icon">
                  <FiCheckCircle size={40} color="#22c55e" />
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
                  Candidature soumise !
                </h2>
                <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
                  Votre candidature à l'élection <strong>"{election?.titre}"</strong> a été enregistrée.
                  Elle sera examinée par l'administrateur.
                </p>
                <button onClick={() => navigate("/")} className="cp-btn-filled">
                  Retour à l'accueil <FiArrowRight size={15} />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
                className="cp-card"
              >
                {/* Header */}
                <div className="cp-card-header">
                  <span className="cp-badge">🌐 Élection publique</span>
                  <h1 className="cp-title">Déposer une candidature</h1>
                  {election && (
                    <div className="cp-election-info">
                      <strong>{election.titre}</strong>
                      <span>{election.description?.slice(0, 100)}{election.description?.length > 100 ? "…" : ""}</span>
                    </div>
                  )}
                </div>

                {errMsg && (
                  <div className="cp-error">{errMsg}</div>
                )}

                <form onSubmit={handleSubmit} className="cp-form">

                  {/* Section 01 — Identité */}
                  <div className="cp-section-label">
                    <span className="cp-section-num">01</span>
                    <span>Votre identité</span>
                  </div>

                  <div className="cp-grid-2">
                    <Field icon={<FiUser size={13}/>} label="Nom *" name="nom" value={form.nom} onChange={handleChange} placeholder="Votre nom" />
                    <Field icon={<FiUser size={13}/>} label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} placeholder="Votre prenpm" />
                  </div>

                  <div className="cp-grid-2">
                    <Field icon={<FiMail size={13}/>}  label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="nomprenom@gmail.com" />
                    <Field icon={<FiPhone size={13}/>} label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} placeholder="6XXXXXXXX" />
                  </div>

                  {/* Section 02 — Photo */}
                  <div className="cp-section-label" style={{ marginTop: 4 }}>
                    <span className="cp-section-num">02</span>
                    <span>Photo de profil</span>
                    <span style={{ fontSize: "10px", color: "#9ca3af", fontWeight: 500, textTransform: "none", letterSpacing: 0, marginLeft: 4 }}>
                      (optionnel)
                    </span>
                  </div>

                  {/* Zone upload photo */}
                  {photoPreview ? (
                    <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "2px solid #e0e7ff" }}>
                      <img
                        src={photoPreview}
                        alt="Aperçu"
                        style={{ width: "100%", height: "180px", objectFit: "cover", display: "block" }}
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)",
                      }} />
                      {/* Nom du fichier */}
                      <div style={{
                        position: "absolute", bottom: "12px", left: "14px",
                        display: "flex", alignItems: "center", gap: "6px",
                      }}>
                        <FiImage size={12} color="white" />
                        <span style={{ fontSize: "11px", color: "white", fontWeight: 600 }}>
                          {photoFile?.name}
                        </span>
                      </div>
                      {/* Boutons */}
                      <div style={{
                        position: "absolute", bottom: "10px", right: "10px",
                        display: "flex", gap: "6px",
                      }}>
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          style={{
                            padding: "5px 12px", borderRadius: "8px",
                            background: "rgba(255,255,255,0.92)", border: "none",
                            color: "#4f46e5", fontSize: "12px", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                          }}
                        >
                          <FiUpload size={11} /> Changer
                        </button>
                        <button
                          type="button"
                          onClick={handlePhotoRemove}
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
                        padding: "28px 20px", textAlign: "center",
                        cursor: "pointer", background: "#fafbff",
                        transition: "all .2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#eef2ff"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#c7d2fe"; e.currentTarget.style.background = "#fafbff"; }}
                    >
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "12px",
                        background: "#eef2ff", display: "flex", alignItems: "center",
                        justifyContent: "center", margin: "0 auto 10px",
                      }}>
                        <FiUpload size={22} color="#6366f1" />
                      </div>
                      <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>
                        Cliquez pour ajouter votre photo
                      </p>
                      <p style={{ margin: 0, fontSize: "11.5px", color: "#9ca3af" }}>
                        PNG, JPG, WEBP — max 5 Mo
                      </p>
                    </div>
                  )}

                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />

                  {/* Section 03 — Présentation */}
                  <div className="cp-section-label" style={{ marginTop: 4 }}>
                    <span className="cp-section-num">03</span>
                    <span>Votre présentation</span>
                  </div>

                  <div className="cp-field">
                    <label className="cp-label"><FiAlignLeft size={12}/> Bio / Programme</label>
                    <textarea
                      name="bio" value={form.bio} onChange={handleChange} rows={4}
                      placeholder="Décrivez votre programme, vos motivations…"
                      className="cp-input"
                      style={{ resize: "none", minHeight: "100px", lineHeight: 1.6 }}
                    />
                  </div>

                  <div className="cp-info-box">
                    Votre candidature sera examinée par l'administrateur avant d'être visible par les électeurs.
                  </div>

                  <button type="submit" disabled={sending} className="cp-btn-submit">
                    {sending ? (
                      <>
                        <FiLoader size={16} style={{ animation: "spin 1s linear infinite" }} />
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

function Field({ icon, label, name, value, onChange, placeholder, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="cp-field">
      <label className="cp-label">{icon} {label}</label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className={`cp-input ${focused ? "cp-input--focused" : ""}`}
      />
    </div>
  );
}

const FULLCENTER = {
  minHeight: "100vh", display: "flex", alignItems: "center",
  justifyContent: "center", flexDirection: "column", gap: 16,
  fontFamily: "Outfit, sans-serif", color: "#6366f1",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .cp-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
  .cp-orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;}
  .cp-orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-180px;left:-180px;}
  .cp-orb-2{width:360px;height:360px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-100px;right:-80px;}
  .cp-nav{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
  .cp-nav-inner{max-width:800px;margin:0 auto;padding:0 32px;height:60px;display:flex;align-items:center;justify-content:space-between;}
  .cp-logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-size:18px;font-weight:700;color:#4f46e5;}
  .cp-back{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
  .cp-back:hover{background:#f8fafc;color:#1e293b;}
  .cp-main{position:relative;z-index:1;padding:48px 24px 80px;display:flex;justify-content:center;}
  .cp-card{width:100%;max-width:680px;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border:1px solid rgba(99,102,241,0.13);border-radius:24px;box-shadow:0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10);overflow:hidden;}
  .cp-card-header{background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px 36px;color:white;}
  .cp-badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.5px;margin-bottom:12px;}
  .cp-title{font-size:26px;font-weight:900;letter-spacing:-0.5px;margin-bottom:14px;}
  .cp-election-info{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;gap:4px;}
  .cp-election-info strong{font-size:14px;font-weight:700;}
  .cp-election-info span{font-size:12px;opacity:.8;line-height:1.5;}
  .cp-error{margin:20px 24px 0;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:13px;font-weight:600;}
  .cp-form{padding:28px 36px;display:flex;flex-direction:column;gap:18px;}
  .cp-section-label{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:.7px;padding-bottom:10px;border-bottom:1px solid #eef2ff;}
  .cp-section-num{background:#6366f1;color:white;width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
  .cp-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .cp-field{display:flex;flex-direction:column;gap:6px;}
  .cp-label{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.6px;}
  .cp-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Outfit',sans-serif;color:#1e293b;background:#fafafa;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
  .cp-input::placeholder{color:#d1d5db;}
  .cp-input--focused,.cp-input:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:white;}
  .cp-info-box{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;font-size:12.5px;color:#92400e;line-height:1.6;}
  .cp-btn-submit{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,0.35);transition:all .2s;}
  .cp-btn-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,0.40);}
  .cp-btn-submit:disabled{opacity:.7;cursor:not-allowed;}
  .cp-btn-filled{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(34,197,94,0.35);transition:all .2s;}
  .cp-success-icon{width:80px;height:80px;border-radius:50%;background:#f0fdf4;border:3px solid #bbf7d0;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;}
  @media(max-width:600px){.cp-grid-2{grid-template-columns:1fr;}.cp-form,.cp-card-header{padding:24px 20px;}.cp-nav-inner{padding:0 20px;}}
`;


































// // src/pages/public/CandidaterPublicPage.jsx
// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUser, FiMail, FiPhone, FiAlignLeft,
//   FiCheckCircle, FiArrowRight, FiArrowLeft, FiLoader,
// } from "react-icons/fi";
// import api from "../../services/api";

// export default function CandidaterPublicPage() {
//   const { id }    = useParams();
//   const navigate  = useNavigate();

//   const [election, setElection] = useState(null);
//   const [loading,  setLoading]  = useState(true);
//   const [sending,  setSending]  = useState(false);
//   const [success,  setSuccess]  = useState(false);
//   const [errMsg,   setErrMsg]   = useState("");

//   const [form, setForm] = useState({
//     nom: "", prenom: "", email: "", telephone: "", bio: "",
//   });

//   useEffect(() => {
//     api.get(`/public-elections/${id}/detail`)
//       .then(r => setElection(r.data.election))
//       .catch(() => setErrMsg("Élection introuvable ou non publique."))
//       .finally(() => setLoading(false));
//   }, [id]);

//   const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (!form.nom || !form.prenom) {
//       setErrMsg("Nom et prénom sont obligatoires.");
//       return;
//     }
//     setSending(true);
//     setErrMsg("");
//     try {
//       await api.post(`/public-elections/${id}/candidater`, form);
//       setSuccess(true);
//     } catch (err) {
//       setErrMsg(err.response?.data?.message || "Une erreur est survenue.");
//     } finally {
//       setSending(false);
//     }
//   };

//   if (loading) return (
//     <div style={FULLCENTER}>
//       <FiLoader size={32} color="#6366f1" style={{ animation: "spin 1s linear infinite" }} />
//       <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
//     </div>
//   );

//   return (
//     <>
//       <style>{styles}</style>
//       <div className="cp-root">
//         <div className="cp-orb cp-orb-1" />
//         <div className="cp-orb cp-orb-2" />

//         {/* Navbar */}
//         <nav className="cp-nav">
//           <div className="cp-nav-inner">
//             <a href="/" className="cp-logo">🗳 <strong>EVote</strong></a>
//             <button onClick={() => navigate(-1)} className="cp-back">
//               <FiArrowLeft size={14} /> Retour
//             </button>
//           </div>
//         </nav>

//         <main className="cp-main">
//           <AnimatePresence mode="wait">
//             {success ? (
//               <motion.div
//                 key="success"
//                 initial={{ opacity: 0, scale: .9 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 className="cp-card"
//                 style={{ textAlign: "center", padding: "60px 40px" }}
//               >
//                 <div className="cp-success-icon">
//                   <FiCheckCircle size={40} color="#22c55e" />
//                 </div>
//                 <h2 style={{ fontSize: "24px", fontWeight: 900, color: "#15803d", marginBottom: 12 }}>
//                   Candidature soumise !
//                 </h2>
//                 <p style={{ color: "#64748b", lineHeight: 1.7, marginBottom: 28, maxWidth: 380, margin: "0 auto 28px" }}>
//                   Votre candidature à l'élection <strong>"{election?.titre}"</strong> a été enregistrée.
//                   Elle sera examinée par l'administrateur.
//                 </p>
//                 <button onClick={() => navigate("/")} className="cp-btn-filled">
//                   Retour à l'accueil <FiArrowRight size={15} />
//                 </button>
//               </motion.div>
//             ) : (
//               <motion.div
//                 key="form"
//                 initial={{ opacity: 0, y: 24 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}
//                 className="cp-card"
//               >
//                 {/* Header */}
//                 <div className="cp-card-header">
//                   <span className="cp-badge">🌐 Élection publique</span>
//                   <h1 className="cp-title">Déposer une candidature</h1>
//                   {election && (
//                     <div className="cp-election-info">
//                       <strong>{election.titre}</strong>
//                       <span>{election.description?.slice(0, 100)}{election.description?.length > 100 ? "…" : ""}</span>
//                     </div>
//                   )}
//                 </div>

//                 {errMsg && (
//                   <div className="cp-error">{errMsg}</div>
//                 )}

//                 <form onSubmit={handleSubmit} className="cp-form">
//                   <div className="cp-section-label">
//                     <span className="cp-section-num">01</span>
//                     <span>Votre identité</span>
//                   </div>

//                   <div className="cp-grid-2">
//                     <Field icon={<FiUser size={13}/>} label="Nom *" name="nom" value={form.nom} onChange={handleChange} placeholder="abdul" />
//                     <Field icon={<FiUser size={13}/>} label="Prénom *" name="prenom" value={form.prenom} onChange={handleChange} placeholder="malick" />
//                   </div>

//                   <div className="cp-grid-2">
//                     <Field icon={<FiMail size={13}/>}  label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="abdulmalick@mail.com" />
//                     <Field icon={<FiPhone size={13}/>} label="Téléphone" name="telephone" value={form.telephone} onChange={handleChange} placeholder="6XXXXXXXX" />
//                   </div>

//                   <div className="cp-section-label" style={{ marginTop: 8 }}>
//                     <span className="cp-section-num">02</span>
//                     <span>Votre présentation</span>
//                   </div>

//                   <div className="cp-field">
//                     <label className="cp-label"><FiAlignLeft size={12}/> Bio / Programme</label>
//                     <textarea
//                       name="bio" value={form.bio} onChange={handleChange} rows={4}
//                       placeholder="Décrivez votre programme, vos motivations…"
//                       className="cp-input"
//                       style={{ resize: "none", minHeight: "100px", lineHeight: 1.6 }}
//                     />
//                   </div>

//                   <div className="cp-info-box">
//                     ℹ️ Votre candidature sera examinée par l'administrateur avant d'être visible par les électeurs.
//                   </div>

//                   <button type="submit" disabled={sending} className="cp-btn-submit">
//                     {sending ? (
//                       <><FiLoader size={16} style={{ animation: "spin 1s linear infinite" }} /> Envoi en cours…</>
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

// function Field({ icon, label, name, value, onChange, placeholder, type = "text" }) {
//   const [focused, setFocused] = useState(false);
//   return (
//     <div className="cp-field">
//       <label className="cp-label">{icon} {label}</label>
//       <input
//         type={type} name={name} value={value} onChange={onChange}
//         placeholder={placeholder}
//         onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
//         className={`cp-input ${focused ? "cp-input--focused" : ""}`}
//       />
//     </div>
//   );
// }

// const FULLCENTER = {
//   minHeight: "100vh", display: "flex", alignItems: "center",
//   justifyContent: "center", flexDirection: "column", gap: 16,
//   fontFamily: "Outfit, sans-serif", color: "#6366f1",
// };

// const styles = `
//   @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
//   *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
//   @keyframes spin{to{transform:rotate(360deg);}}
//   .cp-root{min-height:100vh;font-family:'Outfit',sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f8f9ff 55%,#eff6ff 100%);position:relative;overflow-x:hidden;}
//   .cp-orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0;}
//   .cp-orb-1{width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%);top:-180px;left:-180px;}
//   .cp-orb-2{width:360px;height:360px;background:radial-gradient(circle,rgba(79,70,229,0.09) 0%,transparent 70%);bottom:-100px;right:-80px;}
//   .cp-nav{position:relative;z-index:10;background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid rgba(99,102,241,0.12);box-shadow:0 1px 16px rgba(0,0,0,0.05);}
//   .cp-nav-inner{max-width:800px;margin:0 auto;padding:0 32px;height:60px;display:flex;align-items:center;justify-content:space-between;}
//   .cp-logo{display:flex;align-items:center;gap:8px;text-decoration:none;font-size:18px;font-weight:700;color:#4f46e5;}
//   .cp-back{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
//   .cp-back:hover{background:#f8fafc;color:#1e293b;}
//   .cp-main{position:relative;z-index:1;padding:48px 24px 80px;display:flex;justify-content:center;}
//   .cp-card{width:100%;max-width:680px;background:rgba(255,255,255,0.95);backdrop-filter:blur(16px);border:1px solid rgba(99,102,241,0.13);border-radius:24px;box-shadow:0 4px 6px rgba(0,0,0,0.03),0 24px 64px rgba(79,70,229,0.10);overflow:hidden;}
//   .cp-card-header{background:linear-gradient(135deg,#4f46e5,#6366f1);padding:32px 36px;color:white;}
//   .cp-badge{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:white;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.5px;margin-bottom:12px;}
//   .cp-title{font-size:26px;font-weight:900;letter-spacing:-0.5px;margin-bottom:14px;}
//   .cp-election-info{background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:12px 16px;display:flex;flex-direction:column;gap:4px;}
//   .cp-election-info strong{font-size:14px;font-weight:700;}
//   .cp-election-info span{font-size:12px;opacity:.8;line-height:1.5;}
//   .cp-error{margin:20px 24px 0;padding:12px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#dc2626;font-size:13px;font-weight:600;}
//   .cp-form{padding:28px 36px;display:flex;flex-direction:column;gap:18px;}
//   .cp-section-label{display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:.7px;padding-bottom:10px;border-bottom:1px solid #eef2ff;}
//   .cp-section-num{background:#6366f1;color:white;width:20px;height:20px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;}
//   .cp-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
//   .cp-field{display:flex;flex-direction:column;gap:6px;}
//   .cp-label{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.6px;}
//   .cp-input{width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:10px;font-size:14px;font-family:'Outfit',sans-serif;color:#1e293b;background:#fafafa;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
//   .cp-input::placeholder{color:#d1d5db;}
//   .cp-input--focused,.cp-input:focus{border-color:#818cf8;box-shadow:0 0 0 3px rgba(99,102,241,0.12);background:white;}
//   .cp-info-box{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;font-size:12.5px;color:#92400e;line-height:1.6;}
//   .cp-btn-submit{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;background:linear-gradient(135deg,#4f46e5,#6366f1);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,0.35);transition:all .2s;}
//   .cp-btn-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,0.40);}
//   .cp-btn-submit:disabled{opacity:.7;cursor:not-allowed;}
//   .cp-btn-filled{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;font-family:'Outfit',sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(34,197,94,0.35);transition:all .2s;}
//   .cp-success-icon{width:80px;height:80px;border-radius:50%;background:#f0fdf4;border:3px solid #bbf7d0;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;}
//   @media(max-width:600px){.cp-grid-2{grid-template-columns:1fr;}.cp-form,.cp-card-header{padding:24px 20px;}.cp-nav-inner{padding:0 20px;}}
// `;
