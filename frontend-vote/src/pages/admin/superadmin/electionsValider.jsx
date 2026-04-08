// src/pages/admin/superadmin/electionsValider.jsx
import React, { useState, useEffect } from "react";
import {
  FiCheckCircle, FiXCircle, FiCalendar, FiClock,
  FiGlobe, FiLock, FiImage, FiUsers, FiTag,
} from "react-icons/fi";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

const BACKEND_URL = "http://localhost:5000";
const buildPhotoUrl = (rawUrl) => {
  if (!rawUrl) return null;
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
  return `${BACKEND_URL}${rawUrl}`;
};

const GRADIENTS = [
  ["#e63946","#f4a261"],["#2d6a4f","#74c69d"],["#023e8a","#48cae4"],
  ["#7b2d8b","#e040fb"],["#f72585","#7209b7"],["#4cc9f0","#4361ee"],
];
const getGradient = (titre = "") => {
  const g = GRADIENTS[titre.charCodeAt(0) % GRADIENTS.length];
  return `linear-gradient(135deg,${g[0]},${g[1]})`;
};

const formatDate = (d) => new Date(d).toLocaleString("fr-FR", {
  day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit",
});

// ─── PendingCard ──────────────────────────────────────────────────────────────
function PendingCard({ election, onValider, onRefuser, index }) {
  const [imgError, setImgError] = useState(false);
  const [confirming, setConfirming] = useState(null); // 'valider' | 'refuser' | null
  const photoSrc = buildPhotoUrl(election.photo_url);
  const hasPhoto = !!photoSrc && !imgError;
  const isPublic = election.visibilite === "PUBLIQUE";
  const isListe  = election.type === "LISTE";

  return (
    <div style={{
      background:"white", borderRadius:"20px",
      border:"1px solid #e5e7eb",
      boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
      overflow:"hidden",
      display:"flex", flexDirection:"column",
      animation:`fadeUp .4s ease both`,
      animationDelay:`${index * 0.07}s`,
    }}>
      {/* ── Couverture ── */}
      <div style={{ position:"relative", height:"160px", overflow:"hidden", flexShrink:0 }}>
        {hasPhoto ? (
          <img
            src={photoSrc} alt={election.titre}
            onError={() => setImgError(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
        ) : (
          <div style={{
            width:"100%", height:"100%", background:getGradient(election.titre),
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{ fontSize:72, fontWeight:900, color:"rgba(255,255,255,0.18)", textTransform:"uppercase", letterSpacing:"-5px" }}>
              {election.titre?.slice(0,2)}
            </span>
          </div>
        )}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
        }} />

        {/* Visibilité badge */}
        <div style={{
          position:"absolute", top:10, left:10,
          display:"inline-flex", alignItems:"center", gap:5,
          background: isPublic ? "rgba(14,165,233,0.90)" : "rgba(30,27,75,0.82)",
          backdropFilter:"blur(8px)",
          padding:"4px 11px", borderRadius:"999px",
          fontSize:"11px", fontWeight:700, color:"white",
        }}>
          {isPublic ? <FiGlobe size={10}/> : <FiLock size={10}/>}
          {isPublic ? "Publique" : "Privée"}
        </div>

        {/* Badge EN_ATTENTE */}
        <div style={{
          position:"absolute", top:10, right:10,
          display:"inline-flex", alignItems:"center", gap:5,
          background:"rgba(255,255,255,0.93)", backdropFilter:"blur(8px)",
          padding:"4px 11px", borderRadius:"999px",
          fontSize:"11px", fontWeight:700, color:"#92400e",
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#f59e0b", display:"inline-block" }} />
          En attente
        </div>

        {/* Type bas gauche */}
        <div style={{
          position:"absolute", bottom:10, left:10,
          padding:"3px 10px", borderRadius:"999px",
          fontSize:"10px", fontWeight:700,
          background:"rgba(255,255,255,0.92)", color:"#4f46e5",
        }}>
          {election.type}
        </div>

        {/* Frais bas droit si public */}
        {election.frais_vote_xaf && (
          <div style={{
            position:"absolute", bottom:10, right:10,
            padding:"3px 10px", borderRadius:"999px",
            fontSize:"10px", fontWeight:700,
            background:"rgba(255,255,255,0.92)", color:"#059669",
          }}>
            💳 {election.frais_vote_xaf} XAF
          </div>
        )}
      </div>

      {/* ── Corps ── */}
      <div style={{ padding:"16px 18px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <h3 style={{
          margin:0, fontSize:"14.5px", fontWeight:800, color:"#111827",
          lineHeight:1.3, textTransform:"uppercase",
          display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {election.titre}
        </h3>

        {/* Créateur */}
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{
            width:22, height:22, borderRadius:"50%", background:"#f0fdf4",
            border:"1.5px solid #bbf7d0",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"9px", fontWeight:800, color:"#15803d", flexShrink:0,
          }}>
            {election.prenom_admin?.charAt(0)}{election.nom_admin?.charAt(0)}
          </div>
          <span style={{ fontSize:"12px", color:"#6b7280" }}>
            {election.prenom_admin} {election.nom_admin}
          </span>
        </div>

        {/* Dates */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"11.5px", color:"#9ca3af" }}>
            <FiCalendar size={11}/> Début : {formatDate(election.date_debut)}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"11.5px", color:"#9ca3af" }}>
            <FiClock size={11}/>
            {isListe && election.duree_tour_minutes
              ? `Durée/tour : ${election.duree_tour_minutes >= 1440 ? `${election.duree_tour_minutes/1440}j` : `${election.duree_tour_minutes}min`}`
              : `Fin : ${formatDate(election.date_fin)}`
            }
          </div>
        </div>

        {/* Sièges si liste */}
        {isListe && election.nb_sieges && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:5, alignSelf:"flex-start",
            padding:"3px 10px", borderRadius:"999px",
            background:"#fffbeb", border:"1.5px solid #fde68a",
            fontSize:"11px", fontWeight:700, color:"#92400e",
          }}>
            🏛 {election.nb_sieges} sièges
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ padding:"12px 18px 16px", borderTop:"1px solid #f4f4f5" }}>
        {confirming === null ? (
          <div style={{ display:"flex", gap:10 }}>
            <button
              onClick={() => setConfirming("valider")}
              style={{
                flex:1, padding:"10px 0", borderRadius:"12px",
                background:"linear-gradient(135deg,#22c55e,#16a34a)",
                border:"none", color:"white",
                fontSize:"13px", fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 3px 10px rgba(34,197,94,0.30)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}
            >
              <FiCheckCircle size={14}/> Valider
            </button>
            <button
              onClick={() => setConfirming("refuser")}
              style={{
                flex:1, padding:"10px 0", borderRadius:"12px",
                background:"linear-gradient(135deg,#ef4444,#dc2626)",
                border:"none", color:"white",
                fontSize:"13px", fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
                boxShadow:"0 3px 10px rgba(239,68,68,0.30)",
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
              }}
            >
              <FiXCircle size={14}/> Refuser
            </button>
          </div>
        ) : (
          <div style={{
            background: confirming === "valider" ? "#f0fdf4" : "#fef2f2",
            border: `1.5px solid ${confirming === "valider" ? "#bbf7d0" : "#fecaca"}`,
            borderRadius:"12px", padding:"12px 14px", textAlign:"center",
          }}>
            <p style={{ fontSize:"13px", fontWeight:700, color: confirming === "valider" ? "#15803d" : "#dc2626", marginBottom:10 }}>
              {confirming === "valider" ? "✅ Confirmer la validation ?" : "❌ Confirmer le refus ?"}
            </p>
            <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
              <button
                onClick={() => setConfirming(null)}
                style={{
                  padding:"6px 16px", borderRadius:"8px",
                  border:"1.5px solid #e5e7eb", background:"white",
                  color:"#6b7280", fontSize:"12px", fontWeight:600,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (confirming === "valider") onValider(election.id_election);
                  else onRefuser(election.id_election);
                  setConfirming(null);
                }}
                style={{
                  padding:"6px 20px", borderRadius:"8px", border:"none",
                  background: confirming === "valider" ? "#22c55e" : "#ef4444",
                  color:"white", fontSize:"12px", fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit",
                }}
              >
                Confirmer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ElectionsValider() {
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState({ msg:"", type:"success" });

  useEffect(() => { fetchElections(); }, []);

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"success" }), 3000);
  };

  const fetchElections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/elections/pending");
      setElections(res.data);
    } catch (err) {
      console.error(err);
      notify("Impossible de charger les élections","error");
    } finally {
      setLoading(false);
    }
  };

  const handleValider = async (id) => {
    try {
      await api.put(`/elections/approve/${id}`);
      setElections(prev => prev.filter(e => e.id_election !== id));
      notify("Élection validée avec succès ✅");
    } catch (err) {
      notify("Erreur lors de la validation","error");
    }
  };

  const handleRefuser = async (id) => {
    try {
      await api.put(`/elections/reject/${id}`);
      setElections(prev => prev.filter(e => e.id_election !== id));
      notify("Élection refusée","error");
    } catch (err) {
      notify("Erreur lors du refus","error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
      <div style={{ display:"flex", minHeight:"100vh", background:"linear-gradient(135deg,#dbeafe,#bfdbfe,#93c5fd)", fontFamily:"'Outfit',sans-serif" }}>

        {/* Toast */}
        {toast.msg && (
          <div style={{
            position:"fixed", top:20, right:20, zIndex:50,
            padding:"12px 20px", borderRadius:"14px",
            background: toast.type === "error" ? "#dc2626" : "#1d4ed8",
            color:"white", fontSize:"13.5px", fontWeight:600,
            boxShadow:"0 8px 24px rgba(0,0,0,0.20)",
          }}>
            {toast.msg}
          </div>
        )}

        <SuperAdminSidebar active="valider" />

        <main style={{ flex:1, padding:"32px", overflowY:"auto" }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:"24px", fontWeight:900, color:"#1e3a8a", letterSpacing:"-0.5px", margin:"0 0 6px" }}>
              Élections à valider
            </h2>
            <p style={{ fontSize:"13px", color:"#3b82f6", margin:0 }}>
              {loading ? "Chargement…" : elections.length === 0
                ? "🎉 Toutes les élections ont été traitées"
                : `${elections.length} élection${elections.length > 1 ? "s" : ""} en attente de validation`
              }
            </p>
          </div>

          {/* Contenu */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{
                width:40, height:40, border:"3px solid #bfdbfe",
                borderTopColor:"#1d4ed8", borderRadius:"50%",
                animation:"spin .7s linear infinite", margin:"0 auto 16px",
              }} />
              <p style={{ color:"#64748b", fontSize:"14px" }}>Chargement des élections en attente…</p>
            </div>
          ) : elections.length === 0 ? (
            <div style={{ textAlign:"center", padding:"100px 0" }}>
              <div style={{
                width:80, height:80, borderRadius:"24px",
                background:"white", border:"2px solid #bbf7d0",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 20px",
                boxShadow:"0 8px 24px rgba(0,0,0,0.06)",
              }}>
                <FiCheckCircle size={36} color="#22c55e" />
              </div>
              <h3 style={{ fontSize:"18px", fontWeight:800, color:"#15803d", marginBottom:8 }}>
                Tout est à jour !
              </h3>
              <p style={{ fontSize:"14px", color:"#6b7280" }}>
                Aucune élection en attente de validation pour le moment.
              </p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 }}>
              {elections.map((e, i) => (
                <PendingCard
                  key={e.id_election}
                  election={e}
                  index={i}
                  onValider={handleValider}
                  onRefuser={handleRefuser}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}





































// // src/pages/admin/superadmin/electionsValider.jsx
// import React, { useState, useEffect } from "react";
// import { FiCheckCircle, FiXCircle, FiCalendar, FiClock } from "react-icons/fi";
// import api from "../../../services/api";
// import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

// export default function ElectionsValider() {
//   const [elections, setElections] = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [toast,     setToast]     = useState({ msg: "", type: "success" });

//   useEffect(() => { fetchElections(); }, []);

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   const fetchElections = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/elections/pending");
//       setElections(res.data);
//     } catch (err) {
//       console.error("Erreur fetch elections:", err);
//       notify("Impossible de charger les élections", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatDate = (d) => new Date(d).toLocaleString("fr-FR", {
//     day: "2-digit", month: "2-digit", year: "numeric",
//     hour: "2-digit", minute: "2-digit",
//   });

//   const handleValider = async (id) => {
//     if (!window.confirm("Valider cette élection ?")) return;
//     try {
//       await api.put(`/elections/approve/${id}`);
//       setElections(prev => prev.filter(e => e.id_election !== id));
//       notify("Élection validée avec succès");
//     } catch (err) {
//       notify("Erreur lors de la validation", "error");
//     }
//   };

//   const handleRefuser = async (id) => {
//     if (!window.confirm("Refuser cette élection ?")) return;
//     try {
//       await api.put(`/elections/reject/${id}`);
//       setElections(prev => prev.filter(e => e.id_election !== id));
//       notify("Élection refusée", "error");
//     } catch (err) {
//       notify("Erreur lors du refus", "error");
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* Toast */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
//           toast.type === "error" ? "bg-red-600" : "bg-blue-700"
//         }`}>
//           {toast.msg}
//         </div>
//       )}

//       <SuperAdminSidebar active="valider" />

//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="mb-8">
//           <h2 className="text-2xl font-black text-blue-900 tracking-tight">Élections à valider</h2>
//           <p className="text-sm text-blue-400 mt-1">
//             {loading ? "Chargement…" : `${elections.length} élection${elections.length > 1 ? "s" : ""} en attente de validation`}
//           </p>
//         </div>

//         {/* Table */}
//         <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
//           <table className="min-w-full border-collapse">
//             <thead>
//               <tr className="bg-blue-700">
//                 {["Titre", "Type", "Créateur", "Début", "Fin", "Sièges", "Statut", "Actions"].map((h, i) => (
//                   <th key={h}
//                     className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
//                       i < 7 ? "border-r border-blue-600/50" : "text-center"
//                     }`}>
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="8" className="p-12 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Chargement…</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : elections.length === 0 ? (
//                 <tr>
//                   <td colSpan="8" className="p-16 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
//                         <FiCheckCircle className="text-emerald-400 text-2xl" />
//                       </div>
//                       <p className="text-gray-500 font-semibold">Aucune élection en attente 🎉</p>
//                       <p className="text-gray-400 text-sm">Toutes les élections ont été traitées.</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 elections.map((e, index) => (
//                   <tr key={e.id_election}
//                     className={`border-b border-gray-100 transition-colors hover:bg-blue-50/40 ${
//                       index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
//                     }`}>

//                     {/* Titre */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <p className="text-sm font-semibold text-gray-800">{e.titre}</p>
//                     </td>

//                     {/* Type */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
//                         {e.type}
//                       </span>
//                     </td>

//                     {/* Créateur */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <p className="text-sm text-gray-700">{e.prenom_admin} {e.nom_admin}</p>
//                     </td>

//                     {/* Dates */}
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
//                       <div className="flex items-center gap-1.5">
//                         <FiCalendar size={11} className="text-gray-400" />
//                         {formatDate(e.date_debut)}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
//                       <div className="flex items-center gap-1.5">
//                         <FiClock size={11} className="text-gray-400" />
//                         {e.type === "LISTE" && e.duree_tour_minutes
//                           ? `${e.duree_tour_minutes >= 1440
//                               ? `${e.duree_tour_minutes / 1440}j/tour`
//                               : `${e.duree_tour_minutes}min/tour`}`
//                           : formatDate(e.date_fin)
//                         }
//                       </div>
//                     </td>

//                     {/* Sièges */}
//                     <td className="px-4 py-3.5 border-r border-gray-100 text-center">
//                       {e.nb_sieges
//                         ? <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{e.nb_sieges} sièges</span>
//                         : <span className="text-xs text-gray-300">—</span>
//                       }
//                     </td>

//                     {/* Statut */}
//                     <td className="px-4 py-3.5 border-r border-gray-100">
//                       <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
//                         style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
//                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
//                         En attente
//                       </span>
//                     </td>

//                     {/* Actions */}
//                     <td className="px-4 py-3.5 text-center">
//                       <div className="flex justify-center items-center gap-2">
//                         <button title="Valider"
//                           onClick={() => handleValider(e.id_election)}
//                           className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
//                           <FiCheckCircle size={12} /> Valider
//                         </button>
//                         <button title="Refuser"
//                           onClick={() => handleRefuser(e.id_election)}
//                           className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all text-xs font-bold shadow-sm">
//                           <FiXCircle size={12} /> Refuser
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }
