// src/pages/admin/superadmin/SuperAdminElections.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiPlus, FiEdit, FiTrash2, FiPause, FiPlay,
  FiSearch, FiChevronDown, FiChevronUp, FiUser,
  FiCalendar, FiClock, FiGlobe, FiLock, FiImage,
} from "react-icons/fi";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";
import api from "../../../services/api";

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

const STATUS_CONFIG = {
  EN_COURS:   { bg:"#d1fae5", color:"#065f46", border:"#6ee7b7", dot:true,  label:"En cours"   },
  TERMINEE:   { bg:"#f3f4f6", color:"#4b5563", border:"#d1d5db", dot:false, label:"Terminée"   },
  APPROUVEE:  { bg:"#dbeafe", color:"#1e40af", border:"#93c5fd", dot:false, label:"Approuvée"  },
  SUSPENDUE:  { bg:"#fee2e2", color:"#991b1b", border:"#fca5a5", dot:false, label:"Suspendue"  },
  EN_ATTENTE: { bg:"#fef3c7", color:"#78350f", border:"#fcd34d", dot:false, label:"En attente" },
};

const TYPE_CONFIG = {
  UNINOMINAL: { bg:"#ede9fe", color:"#5b21b6", border:"#c4b5fd" },
  BINOMINAL:  { bg:"#dbeafe", color:"#1e40af", border:"#93c5fd" },
  LISTE:      { bg:"#d1fae5", color:"#065f46", border:"#6ee7b7" },
};

const formatDate = (d) =>
  new Date(d).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });

// ─── ElectionAdminCard ────────────────────────────────────────────────────────
function ElectionAdminCard({ election, admins, expandedId, setExpandedId, onSuspend, onDelete, onChangeAdmin }) {
  const [imgError, setImgError] = useState(false);
  const sc = STATUS_CONFIG[election.statut] || STATUS_CONFIG.EN_ATTENTE;
  const tc = TYPE_CONFIG[election.type]    || TYPE_CONFIG.UNINOMINAL;
  const isSuspended = election.statut === "SUSPENDUE";
  const canEdit     = !["EN_COURS","TERMINEE"].includes(election.statut);

  // ── CORRECTION PRINCIPALE : normalisation de la visibilité ──
  const rawVis  = (election.visibilite || "").toString().toUpperCase().trim();
  const isPublic = rawVis === "PUBLIQUE";

  const photoSrc = buildPhotoUrl(election.photo_url);
  const hasPhoto = !!photoSrc && !imgError;
  const isExpanded = expandedId === election.id_election;

  return (
    <div
      style={{
        background:"white", borderRadius:"20px",
        border:"1px solid #e5e7eb",
        boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
        overflow:"hidden",
        transition:"box-shadow .2s, transform .2s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.10)"; e.currentTarget.style.transform="translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.transform="translateY(0)"; }}
    >
      {/* ── Couverture ── */}
      <div style={{ position:"relative", height:"140px", overflow:"hidden", flexShrink:0 }}>
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
            <FiImage size={32} color="rgba(255,255,255,0.3)" />
          </div>
        )}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
        }} />

        {/* Badge visibilité */}
        <div style={{
          position:"absolute", top:10, left:10,
          display:"inline-flex", alignItems:"center", gap:5,
          background: isPublic ? "rgba(14,165,233,0.88)" : "rgba(30,27,75,0.80)",
          backdropFilter:"blur(8px)",
          padding:"3px 10px", borderRadius:"999px",
          fontSize:"11px", fontWeight:700, color:"white",
        }}>
          {isPublic ? <FiGlobe size={10}/> : <FiLock size={10}/>}
          {isPublic ? "Publique" : "Privée"}
        </div>

        {/* Badge statut */}
        <div style={{
          position:"absolute", top:10, right:10,
          display:"inline-flex", alignItems:"center", gap:5,
          background:"rgba(255,255,255,0.93)", backdropFilter:"blur(8px)",
          padding:"3px 10px", borderRadius:"999px",
          fontSize:"11px", fontWeight:700, color:sc.color,
          boxShadow:"0 1px 6px rgba(0,0,0,0.10)",
        }}>
          <span style={{
            width:6, height:6, borderRadius:"50%", background:sc.color, display:"inline-block",
            animation: sc.dot ? "blink 1.3s ease-in-out infinite" : "none",
          }} />
          {sc.label}
        </div>

        {/* Badge type */}
        <div style={{
          position:"absolute", bottom:10, left:10,
          display:"inline-flex", alignItems:"center",
          padding:"3px 10px", borderRadius:"999px",
          fontSize:"10px", fontWeight:700,
          backgroundColor:tc.bg, color:tc.color, border:`1px solid ${tc.border}`,
        }}>
          {election.type}
        </div>
      </div>

      {/* ── Corps ── */}
      <div style={{ padding:"16px 18px 12px" }}>
        <h3 style={{
          margin:"0 0 6px", fontSize:"14px", fontWeight:800, color:"#111827",
          lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {election.titre}
        </h3>

        {/* Admin */}
        {election.nom_admin && (
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
            <div style={{
              width:24, height:24, borderRadius:"50%", background:"#eef2ff",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"#4f46e5", fontSize:"10px", fontWeight:800, flexShrink:0,
            }}>
              {election.prenom_admin?.charAt(0)}{election.nom_admin?.charAt(0)}
            </div>
            <span style={{ fontSize:"12px", color:"#6b7280", fontWeight:500 }}>
              {election.prenom_admin} {election.nom_admin}
            </span>
          </div>
        )}

        {/* Dates */}
        <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"11.5px", color:"#9ca3af" }}>
            <FiCalendar size={11}/> <span>Début : {formatDate(election.date_debut)}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"11.5px", color:"#9ca3af" }}>
            <FiClock size={11}/> <span>Fin : {formatDate(election.date_fin)}</span>
          </div>
          {election.type === "LISTE" && election.duree_tour_minutes && (
            <div style={{ fontSize:"11px", color:"#a78bfa", fontWeight:600 }}>
              ⏱ {election.duree_tour_minutes >= 1440
                ? `${election.duree_tour_minutes/1440}j/tour`
                : `${election.duree_tour_minutes}min/tour`}
              {election.nb_sieges ? ` · ${election.nb_sieges} sièges` : ""}
            </div>
          )}
        </div>

        {/* Frais vote (élections publiques uniquement) */}
        {isPublic && election.frais_vote_xaf && (
          <div style={{
            display:"inline-flex", alignItems:"center", gap:5,
            background:"#f0fdf4", border:"1px solid #bbf7d0",
            borderRadius:"8px", padding:"4px 10px",
            fontSize:"11.5px", color:"#15803d", fontWeight:700,
            marginBottom:12,
          }}>
            💰 {election.frais_vote_xaf.toLocaleString("fr-FR")} XAF / vote
          </div>
        )}

        {/* Actions */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {canEdit && (
            <Link
              to={`/admin/superadmin/elections/modifier/${election.id_election}`}
              style={{
                display:"inline-flex", alignItems:"center", gap:4,
                padding:"6px 12px", borderRadius:"8px",
                background:"#fffbeb", border:"1.5px solid #fde68a",
                color:"#92400e", fontSize:"11.5px", fontWeight:700,
                textDecoration:"none",
              }}
            >
              <FiEdit size={11}/> Modifier
            </Link>
          )}

          {!["TERMINEE"].includes(election.statut) && (
            <button
              onClick={() => onSuspend(election.id_election, election.statut)}
              style={{
                display:"inline-flex", alignItems:"center", gap:4,
                padding:"6px 12px", borderRadius:"8px",
                background: isSuspended ? "#f0fdf4" : "#fff7ed",
                border: isSuspended ? "1.5px solid #bbf7d0" : "1.5px solid #fed7aa",
                color: isSuspended ? "#15803d" : "#c2410c",
                fontSize:"11.5px", fontWeight:700,
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              {isSuspended ? <><FiPlay size={11}/> Réactiver</> : <><FiPause size={11}/> Suspendre</>}
            </button>
          )}

          <button
            onClick={() => setExpandedId(isExpanded ? null : election.id_election)}
            style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"6px 12px", borderRadius:"8px",
              background: isExpanded ? "#1d4ed8" : "#2563eb",
              border:"none", color:"white",
              fontSize:"11.5px", fontWeight:700,
              cursor:"pointer", fontFamily:"inherit",
            }}
          >
            <FiUser size={11}/> Admin {isExpanded ? <FiChevronUp size={11}/> : <FiChevronDown size={11}/>}
          </button>

          {canEdit && (
            <button
              onClick={() => onDelete(election.id_election)}
              style={{
                display:"inline-flex", alignItems:"center", gap:4,
                padding:"6px 10px", borderRadius:"8px",
                background:"#fef2f2", border:"1.5px solid #fecaca",
                color:"#dc2626", fontSize:"11.5px",
                cursor:"pointer", fontFamily:"inherit",
              }}
            >
              <FiTrash2 size={11}/>
            </button>
          )}
        </div>

        {/* Panel affecter admin */}
        {isExpanded && (
          <div style={{
            marginTop:12, padding:"12px 14px",
            background:"#f0f9ff", borderRadius:"12px",
            border:"1.5px solid #bae6fd",
          }}>
            <p style={{ fontSize:"12px", fontWeight:700, color:"#0369a1", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
              <FiUser size={12}/> Affecter un administrateur
            </p>
            <select
              defaultValue={election.admin_id}
              onChange={e => onChangeAdmin(election.id_election, e.target.value)}
              style={{
                width:"100%", border:"1.5px solid #bae6fd", borderRadius:"8px",
                padding:"8px 10px", fontSize:"12.5px", background:"white",
                color:"#1e40af", fontFamily:"inherit", outline:"none",
              }}
            >
              <option value="">— Choisir un admin —</option>
              {admins.map(a => (
                <option key={a.id} value={a.id}>
                  {a.prenom} {a.nom} ({a.role === "ADMIN_ELECTION" ? "Admin" : "En attente"})
                </option>
              ))}
            </select>
            <p style={{ fontSize:"11px", color:"#64748b", marginTop:6 }}>
              Actuel : <strong>{election.prenom_admin} {election.nom_admin}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function SuperAdminElections() {
  const [elections,    setElections]    = useState([]);
  const [admins,       setAdmins]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("TOUS");
  const [expandedId,   setExpandedId]   = useState(null);
  const [toast,        setToast]        = useState({ msg:"", type:"success" });

  const notify = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"success" }), 3000);
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [elecRes, usersRes] = await Promise.all([
        api.get("/superadmin/elections"),
        api.get("/utilisateurs"),
      ]);
      setElections(elecRes.data);
      setAdmins(usersRes.data.filter(u => ["ADMIN_ELECTION","ADMIN_ELECTION_PENDING"].includes(u.role)));
    } catch (err) {
      console.error(err);
      notify("Erreur de chargement","error");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id, currentStatut) => {
    const isSuspended = currentStatut === "SUSPENDUE";
    if (!window.confirm(isSuspended ? "Réactiver cette élection ?" : "Suspendre cette élection ?")) return;
    try {
      if (isSuspended) await api.put(`/elections/approve/${id}`);
      else             await api.put(`/elections/reject/${id}`);
      notify(isSuspended ? "Élection réactivée" : "Élection suspendue");
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || "Erreur","error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette élection définitivement ?")) return;
    try {
      await api.delete(`/superadmin/elections/${id}`);
      notify("Élection supprimée");
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || "Erreur suppression","error"); }
  };

  const handleChangeAdmin = async (electionId, newAdminId) => {
    try {
      await api.put(`/superadmin/elections/${electionId}/admin`, { admin_id:newAdminId });
      notify("Admin mis à jour");
      fetchAll();
    } catch (err) { notify(err.response?.data?.message || "Erreur","error"); }
  };

  const filtered = elections.filter(e => {
    const matchSearch = `${e.titre} ${e.nom_admin ?? ""} ${e.prenom_admin ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "TOUS" || e.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:      elections.length,
    enCours:    elections.filter(e => e.statut === "EN_COURS").length,
    attente:    elections.filter(e => e.statut === "EN_ATTENTE").length,
    suspendues: elections.filter(e => e.statut === "SUSPENDUE").length,
  };

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes spin   { to{transform:rotate(360deg);} }
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

        <SuperAdminSidebar active="elections" />

        <main style={{ flex:1, padding:"32px", overflowY:"auto" }}>

          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:16 }}>
            <div>
              <h2 style={{ fontSize:"24px", fontWeight:900, color:"#1e3a8a", letterSpacing:"-0.5px", margin:"0 0 4px" }}>
                Toutes les élections
              </h2>
              {!loading && (
                <p style={{ fontSize:"13px", color:"#3b82f6", margin:0 }}>
                  {elections.length} élection{elections.length > 1 ? "s" : ""} dans le système
                </p>
              )}
            </div>
            <Link
              to="/admin/superadmin/elections/creer"
              style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"10px 20px", borderRadius:"12px",
                background:"#1d4ed8", color:"white", textDecoration:"none",
                fontSize:"13.5px", fontWeight:700,
                boxShadow:"0 4px 14px rgba(29,78,216,0.35)",
              }}
            >
              <FiPlus size={15}/> Créer une élection
            </Link>
          </div>

          {/* KPI */}
          {!loading && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
              {[
                { label:"Total",      value:stats.total,      color:"#1d4ed8" },
                { label:"En cours",   value:stats.enCours,    color:"#059669" },
                { label:"En attente", value:stats.attente,    color:"#d97706" },
                { label:"Suspendues", value:stats.suspendues, color:"#dc2626" },
              ].map((k,i) => (
                <div key={i} style={{
                  background:"white", borderRadius:"16px", padding:"20px",
                  textAlign:"center", border:"1px solid #e5e7eb",
                  boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
                }}>
                  <p style={{ fontSize:"28px", fontWeight:900, color:k.color, margin:"0 0 4px" }}>{k.value}</p>
                  <p style={{ fontSize:"11px", color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:".5px", margin:0 }}>{k.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recherche + filtres */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:24 }}>
            <div style={{
              flex:1, minWidth:240, display:"flex", alignItems:"center", gap:10,
              background:"white", border:"1.5px solid #e5e7eb", borderRadius:"12px",
              padding:"10px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
            }}>
              <FiSearch size={14} color="#9ca3af"/>
              <input
                type="text" placeholder="Rechercher par titre ou admin…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex:1, border:"none", outline:"none", fontSize:"14px", fontFamily:"inherit", color:"#111827", background:"transparent" }}
              />
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {["TOUS","EN_COURS","EN_ATTENTE","APPROUVEE","SUSPENDUE","TERMINEE"].map(s => {
                const active = filterStatus === s;
                return (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding:"8px 16px", borderRadius:"10px", fontSize:"12px", fontWeight:700,
                    border: active ? "none" : "1.5px solid #e5e7eb",
                    background: active ? "#1d4ed8" : "white",
                    color: active ? "white" : "#6b7280",
                    cursor:"pointer", fontFamily:"inherit",
                  }}>
                    {s === "TOUS" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
                  </button>
                );
              })}
            </div>
          </div>

          <p style={{ fontSize:"12.5px", color:"#64748b", marginBottom:20 }}>
            {filtered.length} élection{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
          </p>

          {/* Grille */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ width:36, height:36, border:"3px solid #bfdbfe", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }}/>
              <p style={{ color:"#64748b" }}>Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"80px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🗳</div>
              <p style={{ fontSize:"16px", fontWeight:700, color:"#374151" }}>Aucune élection trouvée</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:20 }}>
              {filtered.map(election => (
                <ElectionAdminCard
                  key={election.id_election}
                  election={election}
                  admins={admins}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  onSuspend={handleSuspend}
                  onDelete={handleDelete}
                  onChangeAdmin={handleChangeAdmin}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
















































// // src/pages/admin/superadmin/SuperAdminElections.jsx
// import { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import {
//   FiPlus, FiEdit, FiTrash2, FiPause, FiPlay,
//   FiSearch, FiChevronDown, FiChevronUp, FiUser,
//   FiCalendar, FiClock, FiGlobe, FiLock, FiImage,
// } from "react-icons/fi";
// import SuperAdminSidebar from "../../../components/SuperAdminSidebar";
// import api from "../../../services/api";

// const BACKEND_URL = "http://localhost:5000";
// const buildPhotoUrl = (rawUrl) => {
//   if (!rawUrl) return null;
//   if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) return rawUrl;
//   return `${BACKEND_URL}${rawUrl}`;
// };

// const GRADIENTS = [
//   ["#e63946","#f4a261"],["#2d6a4f","#74c69d"],["#023e8a","#48cae4"],
//   ["#7b2d8b","#e040fb"],["#f72585","#7209b7"],["#4cc9f0","#4361ee"],
// ];
// const getGradient = (titre = "") => {
//   const g = GRADIENTS[titre.charCodeAt(0) % GRADIENTS.length];
//   return `linear-gradient(135deg,${g[0]},${g[1]})`;
// };

// const STATUS_CONFIG = {
//   EN_COURS:   { bg:"#d1fae5", color:"#065f46", border:"#6ee7b7", dot:true,  label:"En cours"   },
//   TERMINEE:   { bg:"#f3f4f6", color:"#4b5563", border:"#d1d5db", dot:false, label:"Terminée"   },
//   APPROUVEE:  { bg:"#dbeafe", color:"#1e40af", border:"#93c5fd", dot:false, label:"Approuvée"  },
//   SUSPENDUE:  { bg:"#fee2e2", color:"#991b1b", border:"#fca5a5", dot:false, label:"Suspendue"  },
//   EN_ATTENTE: { bg:"#fef3c7", color:"#78350f", border:"#fcd34d", dot:false, label:"En attente" },
// };

// const TYPE_CONFIG = {
//   UNINOMINAL: { bg:"#ede9fe", color:"#5b21b6", border:"#c4b5fd" },
//   BINOMINAL:  { bg:"#dbeafe", color:"#1e40af", border:"#93c5fd" },
//   LISTE:      { bg:"#d1fae5", color:"#065f46", border:"#6ee7b7" },
// };

// const formatDate = (d) =>
//   new Date(d).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });

// // ─── ElectionAdminCard ────────────────────────────────────────────────────────
// function ElectionAdminCard({ election, admins, expandedId, setExpandedId, onSuspend, onDelete, onChangeAdmin }) {
//   const [imgError, setImgError] = useState(false);
//   const sc = STATUS_CONFIG[election.statut] || STATUS_CONFIG.EN_ATTENTE;
//   const tc = TYPE_CONFIG[election.type]    || TYPE_CONFIG.UNINOMINAL;
//   const isSuspended = election.statut === "SUSPENDUE";
//   const canEdit     = !["EN_COURS","TERMINEE"].includes(election.statut);
//   const isPublic    = election.visibilite === "PUBLIQUE";
//   const photoSrc    = buildPhotoUrl(election.photo_url);
//   const hasPhoto    = !!photoSrc && !imgError;
//   const isExpanded  = expandedId === election.id_election;

//   return (
//     <div style={{
//       background:"white", borderRadius:"20px",
//       border:"1px solid #e5e7eb",
//       boxShadow:"0 2px 8px rgba(0,0,0,0.05)",
//       overflow:"hidden",
//       transition:"box-shadow .2s, transform .2s",
//     }}
//     onMouseEnter={e => { e.currentTarget.style.boxShadow="0 8px 28px rgba(0,0,0,0.10)"; e.currentTarget.style.transform="translateY(-2px)"; }}
//     onMouseLeave={e => { e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.05)"; e.currentTarget.style.transform="translateY(0)"; }}
//     >
//       {/* ── Couverture ── */}
//       <div style={{ position:"relative", height:"140px", overflow:"hidden", flexShrink:0 }}>
//         {hasPhoto ? (
//           <img
//             src={photoSrc} alt={election.titre}
//             onError={() => setImgError(true)}
//             style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
//           />
//         ) : (
//           <div style={{ width:"100%", height:"100%", background:getGradient(election.titre),
//             display:"flex", alignItems:"center", justifyContent:"center" }}>
//             <FiImage size={32} color="rgba(255,255,255,0.3)" />
//           </div>
//         )}
//         <div style={{
//           position:"absolute", inset:0,
//           background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
//         }} />

//         {/* Visibilité */}
//         <div style={{
//           position:"absolute", top:10, left:10,
//           display:"inline-flex", alignItems:"center", gap:5,
//           background: isPublic ? "rgba(14,165,233,0.88)" : "rgba(30,27,75,0.80)",
//           backdropFilter:"blur(8px)",
//           padding:"3px 10px", borderRadius:"999px",
//           fontSize:"11px", fontWeight:700, color:"white",
//         }}>
//           {isPublic ? <FiGlobe size={10}/> : <FiLock size={10}/>}
//           {isPublic ? "Publique" : "Privée"}
//         </div>

//         {/* Statut */}
//         <div style={{
//           position:"absolute", top:10, right:10,
//           display:"inline-flex", alignItems:"center", gap:5,
//           background:"rgba(255,255,255,0.93)", backdropFilter:"blur(8px)",
//           padding:"3px 10px", borderRadius:"999px",
//           fontSize:"11px", fontWeight:700, color:sc.color,
//           boxShadow:"0 1px 6px rgba(0,0,0,0.10)",
//         }}>
//           <span style={{ width:6, height:6, borderRadius:"50%", background:sc.color, display:"inline-block",
//             animation: sc.dot ? "blink 1.3s ease-in-out infinite" : "none" }} />
//           {sc.label}
//         </div>

//         {/* Type */}
//         <div style={{
//           position:"absolute", bottom:10, left:10,
//           display:"inline-flex", alignItems:"center",
//           padding:"3px 10px", borderRadius:"999px",
//           fontSize:"10px", fontWeight:700,
//           backgroundColor: tc.bg, color:tc.color,
//           border:`1px solid ${tc.border}`,
//         }}>
//           {election.type}
//         </div>
//       </div>

//       {/* ── Corps ── */}
//       <div style={{ padding:"16px 18px 12px" }}>
//         <h3 style={{
//           margin:"0 0 6px", fontSize:"14px", fontWeight:800, color:"#111827",
//           lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2,
//           WebkitBoxOrient:"vertical", overflow:"hidden",
//         }}>
//           {election.titre}
//         </h3>

//         {/* Admin */}
//         {election.nom_admin && (
//           <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:10 }}>
//             <div style={{
//               width:24, height:24, borderRadius:"50%", background:"#eef2ff",
//               display:"flex", alignItems:"center", justifyContent:"center",
//               color:"#4f46e5", fontSize:"10px", fontWeight:800, flexShrink:0,
//             }}>
//               {election.prenom_admin?.charAt(0)}{election.nom_admin?.charAt(0)}
//             </div>
//             <span style={{ fontSize:"12px", color:"#6b7280", fontWeight:500 }}>
//               {election.prenom_admin} {election.nom_admin}
//             </span>
//           </div>
//         )}

//         {/* Dates */}
//         <div style={{ display:"flex", flexDirection:"column", gap:4, marginBottom:14 }}>
//           <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"11.5px", color:"#9ca3af" }}>
//             <FiCalendar size={11} /> <span>Début : {formatDate(election.date_debut)}</span>
//           </div>
//           <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:"11.5px", color:"#9ca3af" }}>
//             <FiClock size={11} /> <span>Fin : {formatDate(election.date_fin)}</span>
//           </div>
//           {election.type === "LISTE" && election.duree_tour_minutes && (
//             <div style={{ fontSize:"11px", color:"#a78bfa", fontWeight:600 }}>
//               ⏱ {election.duree_tour_minutes >= 1440 ? `${election.duree_tour_minutes/1440}j/tour` : `${election.duree_tour_minutes}min/tour`}
//               {election.nb_sieges ? ` · ${election.nb_sieges} sièges` : ""}
//             </div>
//           )}
//         </div>

//         {/* Actions */}
//         <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
//           {canEdit && (
//             <Link
//               to={`/admin/superadmin/elections/modifier/${election.id_election}`}
//               style={{
//                 display:"inline-flex", alignItems:"center", gap:4,
//                 padding:"6px 12px", borderRadius:"8px",
//                 background:"#fffbeb", border:"1.5px solid #fde68a",
//                 color:"#92400e", fontSize:"11.5px", fontWeight:700,
//                 textDecoration:"none", transition:"all .15s",
//               }}
//             >
//               <FiEdit size={11}/> Modifier
//             </Link>
//           )}

//           {!["TERMINEE"].includes(election.statut) && (
//             <button
//               onClick={() => onSuspend(election.id_election, election.statut)}
//               style={{
//                 display:"inline-flex", alignItems:"center", gap:4,
//                 padding:"6px 12px", borderRadius:"8px",
//                 background: isSuspended ? "#f0fdf4" : "#fff7ed",
//                 border: isSuspended ? "1.5px solid #bbf7d0" : "1.5px solid #fed7aa",
//                 color: isSuspended ? "#15803d" : "#c2410c",
//                 fontSize:"11.5px", fontWeight:700,
//                 cursor:"pointer", fontFamily:"inherit",
//               }}
//             >
//               {isSuspended ? <><FiPlay size={11}/> Réactiver</> : <><FiPause size={11}/> Suspendre</>}
//             </button>
//           )}

//           <button
//             onClick={() => setExpandedId(isExpanded ? null : election.id_election)}
//             style={{
//               display:"inline-flex", alignItems:"center", gap:4,
//               padding:"6px 12px", borderRadius:"8px",
//               background: isExpanded ? "#1d4ed8" : "#2563eb",
//               border:"none", color:"white",
//               fontSize:"11.5px", fontWeight:700,
//               cursor:"pointer", fontFamily:"inherit",
//             }}
//           >
//             <FiUser size={11}/> Admin {isExpanded ? <FiChevronUp size={11}/> : <FiChevronDown size={11}/>}
//           </button>

//           {canEdit && (
//             <button
//               onClick={() => onDelete(election.id_election)}
//               style={{
//                 display:"inline-flex", alignItems:"center", gap:4,
//                 padding:"6px 10px", borderRadius:"8px",
//                 background:"#fef2f2", border:"1.5px solid #fecaca",
//                 color:"#dc2626", fontSize:"11.5px",
//                 cursor:"pointer", fontFamily:"inherit",
//               }}
//             >
//               <FiTrash2 size={11}/>
//             </button>
//           )}
//         </div>

//         {/* Expanded — affecter admin */}
//         {isExpanded && (
//           <div style={{
//             marginTop:12, padding:"12px 14px",
//             background:"#f0f9ff", borderRadius:"12px",
//             border:"1.5px solid #bae6fd",
//           }}>
//             <p style={{ fontSize:"12px", fontWeight:700, color:"#0369a1", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
//               <FiUser size={12}/> Affecter un administrateur
//             </p>
//             <select
//               defaultValue={election.admin_id}
//               onChange={e => onChangeAdmin(election.id_election, e.target.value)}
//               style={{
//                 width:"100%", border:"1.5px solid #bae6fd", borderRadius:"8px",
//                 padding:"8px 10px", fontSize:"12.5px", background:"white",
//                 color:"#1e40af", fontFamily:"inherit", outline:"none",
//               }}
//             >
//               <option value="">— Choisir un admin —</option>
//               {admins.map(a => (
//                 <option key={a.id} value={a.id}>
//                   {a.prenom} {a.nom} ({a.role === "ADMIN_ELECTION" ? "Admin" : "En attente"})
//                 </option>
//               ))}
//             </select>
//             <p style={{ fontSize:"11px", color:"#64748b", marginTop:6 }}>
//               Actuel : <strong>{election.prenom_admin} {election.nom_admin}</strong>
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function SuperAdminElections() {
//   const [elections,    setElections]    = useState([]);
//   const [admins,       setAdmins]       = useState([]);
//   const [loading,      setLoading]      = useState(true);
//   const [search,       setSearch]       = useState("");
//   const [filterStatus, setFilterStatus] = useState("TOUS");
//   const [expandedId,   setExpandedId]   = useState(null);
//   const [toast,        setToast]        = useState({ msg:"", type:"success" });

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg:"", type:"success" }), 3000);
//   };

//   useEffect(() => { fetchAll(); }, []);

//   const fetchAll = async () => {
//     try {
//       setLoading(true);
//       const [elecRes, usersRes] = await Promise.all([
//         api.get("/superadmin/elections"),
//         api.get("/utilisateurs"),
//       ]);
//       setElections(elecRes.data);
//       setAdmins(usersRes.data.filter(u => ["ADMIN_ELECTION","ADMIN_ELECTION_PENDING"].includes(u.role)));
//     } catch (err) {
//       console.error(err);
//       notify("Erreur de chargement","error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSuspend = async (id, currentStatut) => {
//     const isSuspended = currentStatut === "SUSPENDUE";
//     if (!window.confirm(isSuspended ? "Réactiver cette élection ?" : "Suspendre cette élection ?")) return;
//     try {
//       if (isSuspended) await api.put(`/elections/approve/${id}`);
//       else await api.put(`/elections/reject/${id}`);
//       notify(isSuspended ? "Élection réactivée" : "Élection suspendue");
//       fetchAll();
//     } catch (err) { notify(err.response?.data?.message || "Erreur","error"); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Supprimer cette élection définitivement ?")) return;
//     try {
//       await api.delete(`/superadmin/elections/${id}`);
//       notify("Élection supprimée");
//       fetchAll();
//     } catch (err) { notify(err.response?.data?.message || "Erreur suppression","error"); }
//   };

//   const handleChangeAdmin = async (electionId, newAdminId) => {
//     try {
//       await api.put(`/superadmin/elections/${electionId}/admin`, { admin_id:newAdminId });
//       notify("Admin mis à jour");
//       fetchAll();
//     } catch (err) { notify(err.response?.data?.message || "Erreur","error"); }
//   };

//   const filtered = elections.filter(e => {
//     const matchSearch = `${e.titre} ${e.nom_admin} ${e.prenom_admin}`.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = filterStatus === "TOUS" || e.statut === filterStatus;
//     return matchSearch && matchStatus;
//   });

//   const stats = {
//     total:      elections.length,
//     enCours:    elections.filter(e => e.statut === "EN_COURS").length,
//     attente:    elections.filter(e => e.statut === "EN_ATTENTE").length,
//     suspendues: elections.filter(e => e.statut === "SUSPENDUE").length,
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes blink{0%,100%{opacity:1;}50%{opacity:.3;}}
//         @keyframes spin{to{transform:rotate(360deg);}}
//       `}</style>
//       <div style={{ display:"flex", minHeight:"100vh", background:"linear-gradient(135deg,#dbeafe,#bfdbfe,#93c5fd)", fontFamily:"'Outfit',sans-serif" }}>

//         {/* Toast */}
//         {toast.msg && (
//           <div style={{
//             position:"fixed", top:20, right:20, zIndex:50,
//             padding:"12px 20px", borderRadius:"14px",
//             background: toast.type === "error" ? "#dc2626" : "#1d4ed8",
//             color:"white", fontSize:"13.5px", fontWeight:600,
//             boxShadow:"0 8px 24px rgba(0,0,0,0.20)",
//           }}>
//             {toast.msg}
//           </div>
//         )}

//         <SuperAdminSidebar active="elections" />

//         <main style={{ flex:1, padding:"32px", overflowY:"auto" }}>

//           {/* Header */}
//           <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28, flexWrap:"wrap", gap:16 }}>
//             <div>
//               <h2 style={{ fontSize:"24px", fontWeight:900, color:"#1e3a8a", letterSpacing:"-0.5px", margin:"0 0 4px" }}>
//                 Toutes les élections
//               </h2>
//               {!loading && (
//                 <p style={{ fontSize:"13px", color:"#3b82f6", margin:0 }}>
//                   {elections.length} élection{elections.length > 1 ? "s" : ""} dans le système
//                 </p>
//               )}
//             </div>
//             <Link
//               to="/admin/superadmin/elections/creer"
//               style={{
//                 display:"inline-flex", alignItems:"center", gap:7,
//                 padding:"10px 20px", borderRadius:"12px",
//                 background:"#1d4ed8", color:"white", textDecoration:"none",
//                 fontSize:"13.5px", fontWeight:700,
//                 boxShadow:"0 4px 14px rgba(29,78,216,0.35)",
//               }}
//             >
//               <FiPlus size={15}/> Créer une élection
//             </Link>
//           </div>

//           {/* KPI */}
//           {!loading && (
//             <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
//               {[
//                 { label:"Total",      value:stats.total,      color:"#1d4ed8", bg:"#eff6ff" },
//                 { label:"En cours",   value:stats.enCours,    color:"#059669", bg:"#f0fdf4" },
//                 { label:"En attente", value:stats.attente,    color:"#d97706", bg:"#fffbeb" },
//                 { label:"Suspendues", value:stats.suspendues, color:"#dc2626", bg:"#fef2f2" },
//               ].map((k,i) => (
//                 <div key={i} style={{
//                   background:"white", borderRadius:"16px", padding:"20px",
//                   textAlign:"center", border:"1px solid #e5e7eb",
//                   boxShadow:"0 2px 8px rgba(0,0,0,0.04)",
//                 }}>
//                   <p style={{ fontSize:"28px", fontWeight:900, color:k.color, margin:"0 0 4px" }}>{k.value}</p>
//                   <p style={{ fontSize:"11px", color:"#9ca3af", fontWeight:600, textTransform:"uppercase", letterSpacing:".5px", margin:0 }}>{k.label}</p>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* Recherche + filtres */}
//           <div style={{ display:"flex", flexWrap:"wrap", gap:12, marginBottom:24 }}>
//             <div style={{
//               flex:1, minWidth:240, display:"flex", alignItems:"center", gap:10,
//               background:"white", border:"1.5px solid #e5e7eb", borderRadius:"12px",
//               padding:"10px 14px", boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
//             }}>
//               <FiSearch size={14} color="#9ca3af" />
//               <input
//                 type="text" placeholder="Rechercher par titre ou admin…"
//                 value={search} onChange={e => setSearch(e.target.value)}
//                 style={{ flex:1, border:"none", outline:"none", fontSize:"14px", fontFamily:"inherit", color:"#111827", background:"transparent" }}
//               />
//             </div>
//             <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
//               {["TOUS","EN_COURS","EN_ATTENTE","APPROUVEE","SUSPENDUE","TERMINEE"].map(s => {
//                 const active = filterStatus === s;
//                 const cfg = STATUS_CONFIG[s];
//                 return (
//                   <button key={s} onClick={() => setFilterStatus(s)} style={{
//                     padding:"8px 16px", borderRadius:"10px", fontSize:"12px", fontWeight:700,
//                     border: active ? "none" : "1.5px solid #e5e7eb",
//                     background: active ? "#1d4ed8" : "white",
//                     color: active ? "white" : "#6b7280",
//                     cursor:"pointer", fontFamily:"inherit", transition:"all .15s",
//                   }}>
//                     {s === "TOUS" ? "Tous" : cfg?.label ?? s}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Compteur */}
//           <p style={{ fontSize:"12.5px", color:"#64748b", marginBottom:20 }}>
//             {filtered.length} élection{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
//           </p>

//           {/* Grille de cards */}
//           {loading ? (
//             <div style={{ textAlign:"center", padding:"80px 0" }}>
//               <div style={{ width:36, height:36, border:"3px solid #bfdbfe", borderTopColor:"#1d4ed8", borderRadius:"50%", animation:"spin .7s linear infinite", margin:"0 auto 16px" }} />
//               <p style={{ color:"#64748b" }}>Chargement…</p>
//             </div>
//           ) : filtered.length === 0 ? (
//             <div style={{ textAlign:"center", padding:"80px 0" }}>
//               <div style={{ fontSize:48, marginBottom:12 }}>🗳</div>
//               <p style={{ fontSize:"16px", fontWeight:700, color:"#374151" }}>Aucune élection trouvée</p>
//             </div>
//           ) : (
//             <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:20 }}>
//               {filtered.map(election => (
//                 <ElectionAdminCard
//                   key={election.id_election}
//                   election={election}
//                   admins={admins}
//                   expandedId={expandedId}
//                   setExpandedId={setExpandedId}
//                   onSuspend={handleSuspend}
//                   onDelete={handleDelete}
//                   onChangeAdmin={handleChangeAdmin}
//                 />
//               ))}
//             </div>
//           )}
//         </main>
//       </div>
//     </>
//   );
// }









































// // src/pages/admin/superadmin/SuperAdminElections.jsx
// import { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import {
//   FiHome, FiUsers, FiBarChart2, FiSettings, FiLogOut,
//   FiPlus, FiEdit, FiTrash2, FiPause, FiPlay,
//   FiSearch, FiCalendar, FiChevronDown, FiChevronUp,
//   FiUser
// } from "react-icons/fi";
// import SuperAdminSidebar from "../../../components/SuperAdminSidebar";
// import api from "../../../services/api";

// const STATUS_CONFIG = {
//   EN_COURS:   { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7", dot: true,  label: "En cours" },
//   TERMINEE:   { bg: "#f3f4f6", color: "#4b5563", border: "#d1d5db", dot: false, label: "Terminée" },
//   APPROUVEE:  { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd", dot: false, label: "Approuvée" },
//   SUSPENDUE:  { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5", dot: false, label: "Suspendue" },
//   EN_ATTENTE: { bg: "#fef3c7", color: "#78350f", border: "#fcd34d", dot: false, label: "En attente" },
// };

// const TYPE_CONFIG = {
//   UNINOMINAL: { bg: "#ede9fe", color: "#5b21b6", border: "#c4b5fd" },
//   BINOMINAL:  { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
//   LISTE:      { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
// };

// export default function SuperAdminElections() {
//   const navigate = useNavigate();

//   const [elections, setElections] = useState([]);
//   const [admins,    setAdmins]    = useState([]);
//   const [loading,   setLoading]   = useState(true);
//   const [search,    setSearch]    = useState("");
//   const [filterStatus, setFilterStatus] = useState("TOUS");
//   const [expandedId, setExpandedId] = useState(null);
//   const [toast,     setToast]     = useState({ msg: "", type: "success" });

//   const notify = (msg, type = "success") => {
//     setToast({ msg, type });
//     setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
//   };

//   useEffect(() => { fetchAll(); }, []);

//   const fetchAll = async () => {
//     try {
//       setLoading(true);
//       const [elecRes, usersRes] = await Promise.all([
//         api.get("/superadmin/elections"),
//         api.get("/utilisateurs"),
//       ]);
//       setElections(elecRes.data);
//       setAdmins(usersRes.data.filter(u =>
//         ["ADMIN_ELECTION", "ADMIN_ELECTION_PENDING"].includes(u.role)
//       ));
//     } catch (err) {
//       console.error(err);
//       notify("Erreur de chargement", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSuspend = async (id, currentStatut) => {
//     const isSuspended = currentStatut === "SUSPENDUE";
//     const msg = isSuspended
//       ? "Réactiver cette élection ?"
//       : "Suspendre cette élection ?";
//     if (!window.confirm(msg)) return;
//     try {
//       if (isSuspended) {
//         await api.put(`/elections/approve/${id}`);
//         notify("Élection réactivée (approuvée)");
//       } else {
//         await api.put(`/elections/reject/${id}`);
//         notify("Élection suspendue");
//       }
//       fetchAll();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur", "error");
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Supprimer cette élection définitivement ?")) return;
//     try {
//       await api.delete(`/superadmin/elections/${id}`);
//       notify("Élection supprimée");
//       fetchAll();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur suppression", "error");
//     }
//   };

//   const handleChangeAdmin = async (electionId, newAdminId) => {
//     try {
//       await api.put(`/superadmin/elections/${electionId}/admin`, { admin_id: newAdminId });
//       notify("Admin mis à jour");
//       fetchAll();
//     } catch (err) {
//       notify(err.response?.data?.message || "Erreur", "error");
//     }
//   };

//   const formatDate = (d) =>
//     new Date(d).toLocaleString("fr-FR", {
//       day: "2-digit", month: "2-digit", year: "numeric",
//       hour: "2-digit", minute: "2-digit"
//     });

//   const filtered = elections.filter(e => {
//     const matchSearch = `${e.titre} ${e.nom_admin} ${e.prenom_admin}`
//       .toLowerCase().includes(search.toLowerCase());
//     const matchStatus = filterStatus === "TOUS" || e.statut === filterStatus;
//     return matchSearch && matchStatus;
//   });

//   const stats = {
//     total:     elections.length,
//     enCours:   elections.filter(e => e.statut === "EN_COURS").length,
//     attente:   elections.filter(e => e.statut === "EN_ATTENTE").length,
//     suspendues: elections.filter(e => e.statut === "SUSPENDUE").length,
//   };

//   return (
//     <div className="flex min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">

//       {/* ── TOAST ─────────────────────────────────────────────────────────── */}
//       {toast.msg && (
//         <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
//           toast.type === "error" ? "bg-red-600" : "bg-blue-700"
//         }`}>
//           {toast.msg}
//         </div>
//       )}

//       {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
//       <SuperAdminSidebar active="elections" />

//       {/* ── MAIN ──────────────────────────────────────────────────────────── */}
//       <main className="flex-1 p-8 overflow-y-auto">

//         {/* Header */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h2 className="text-2xl font-black text-blue-900 tracking-tight">Toutes les élections</h2>
//             {!loading && (
//               <p className="text-sm text-blue-400 mt-1">
//                 {elections.length} élection{elections.length > 1 ? "s" : ""} dans le système
//               </p>
//             )}
//           </div>
//           <Link
//             to="/admin/superadmin/elections/creer"
//             className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold text-sm shadow-md shadow-blue-200/60"
//           >
//             <FiPlus size={15} /> Créer une élection
//           </Link>
//         </div>

//         {/* KPI */}
//         {!loading && (
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
//             {[
//               { label: "Total",      value: stats.total,      color: "#1d4ed8" },
//               { label: "En cours",   value: stats.enCours,    color: "#059669" },
//               { label: "En attente", value: stats.attente,    color: "#d97706" },
//               { label: "Suspendues", value: stats.suspendues, color: "#dc2626" },
//             ].map((k, i) => (
//               <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
//                 <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
//                 <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{k.label}</p>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Filtres */}
//         <div className="flex flex-wrap gap-3 mb-4">
//           {/* Recherche */}
//           <div className="relative flex-1 min-w-48">
//             <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
//             <input
//               type="text" placeholder="Rechercher par titre ou admin…"
//               value={search} onChange={e => setSearch(e.target.value)}
//               className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
//             />
//           </div>
//           {/* Filtre statut */}
//           <div className="flex gap-1.5 flex-wrap">
//             {["TOUS", "EN_COURS", "EN_ATTENTE", "APPROUVEE", "SUSPENDUE", "TERMINEE"].map(s => (
//               <button
//                 key={s}
//                 onClick={() => setFilterStatus(s)}
//                 className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
//                   filterStatus === s
//                     ? "bg-blue-600 text-white shadow-sm"
//                     : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
//                 }`}
//               >
//                 {s === "TOUS" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* TABLE */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
//           <table className="min-w-full border-collapse">
//             <thead>
//               <tr className="bg-blue-700">
//                 {["Titre", "Type", "Admin", "Début", "Fin", "Statut", "Actions"].map((h, i) => (
//                   <th key={h}
//                     className={`px-4 py-3.5 text-left text-xs font-bold text-white/90 uppercase tracking-wider ${
//                       h === "Actions" ? "text-center w-48" :
//                       h === "Type"   ? "w-28 border-r border-blue-600/50" :
//                       h === "Début" || h === "Fin" ? "w-36 border-r border-blue-600/50" :
//                       h === "Statut" ? "w-32 border-r border-blue-600/50" :
//                       "border-r border-blue-600/50"
//                     }`}>
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="7" className="p-12 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
//                       <p className="text-gray-400 text-sm">Chargement…</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : filtered.length === 0 ? (
//                 <tr>
//                   <td colSpan="7" className="p-16 text-center">
//                     <div className="flex flex-col items-center gap-3">
//                       <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
//                         <FiCalendar className="text-blue-300 text-2xl" />
//                       </div>
//                       <p className="text-gray-500 font-semibold">Aucune élection trouvée</p>
//                     </div>
//                   </td>
//                 </tr>
//               ) : (
//                 filtered.map((election, index) => {
//                   const sc  = STATUS_CONFIG[election.statut] || STATUS_CONFIG.EN_ATTENTE;
//                   const tc  = TYPE_CONFIG[election.type]    || TYPE_CONFIG.UNINOMINAL;
//                   const isSuspended = election.statut === "SUSPENDUE";
//                   const canEdit     = !["EN_COURS", "TERMINEE"].includes(election.statut);

//                   return (
//                     <>
//                       <tr key={election.id_election}
//                         className={`border-b border-gray-100 transition-colors duration-150 hover:bg-blue-50/30 ${
//                           index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
//                         }`}>

//                         {/* Titre */}
//                         <td className="px-4 py-3.5 border-r border-gray-100">
//                           <p className="text-sm font-semibold text-gray-800">{election.titre}</p>
//                           {election.nb_sieges && election.type === "LISTE" && (
//                             <p className="text-xs text-gray-400 mt-0.5">{election.nb_sieges} sièges</p>
//                           )}
//                         </td>

//                         {/* Type */}
//                         <td className="px-4 py-3.5 border-r border-gray-100">
//                           <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
//                             style={{ backgroundColor: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
//                             {election.type}
//                           </span>
//                         </td>

//                         {/* Admin */}
//                         <td className="px-4 py-3.5 border-r border-gray-100">
//                           {election.nom_admin ? (
//                             <div className="flex items-center gap-2">
//                               <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs flex-shrink-0">
//                                 {election.prenom_admin?.charAt(0)}{election.nom_admin?.charAt(0)}
//                               </div>
//                               <span className="text-xs text-gray-700 font-medium">
//                                 {election.prenom_admin} {election.nom_admin}
//                               </span>
//                             </div>
//                           ) : (
//                             <span className="text-xs text-gray-400">—</span>
//                           )}
//                         </td>

//                         {/* Dates */}
//                         <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
//                           {formatDate(election.date_debut)}
//                         </td>
//                         <td className="px-4 py-3.5 border-r border-gray-100 text-xs text-gray-500 whitespace-nowrap">
//                           {formatDate(election.date_fin)}
//                         </td>

//                         {/* Statut */}
//                         <td className="px-4 py-3.5 border-r border-gray-100">
//                           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
//                             style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
//                             <span className={`w-1.5 h-1.5 rounded-full ${sc.dot ? "animate-pulse" : ""}`}
//                               style={{ backgroundColor: sc.color }} />
//                             {sc.label}
//                           </span>
//                         </td>

//                         {/* Actions */}
//                         <td className="px-4 py-3.5 text-center">
//                           <div className="flex justify-center items-center gap-1.5 flex-wrap">

//                             {/* Modifier */}
//                             {canEdit && (
//                               <Link
//                                 to={`/admin/superadmin/elections/modifier/${election.id_election}`}
//                                 className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 active:scale-95 transition-all text-xs font-bold"
//                               >
//                                 <FiEdit size={11} /> Modifier
//                               </Link>
//                             )}

//                             {/* Suspendre / Réactiver */}
//                             {!["TERMINEE"].includes(election.statut) && (
//                               <button
//                                 onClick={() => handleSuspend(election.id_election, election.statut)}
//                                 className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all text-xs font-bold ${
//                                   isSuspended
//                                     ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
//                                     : "bg-orange-100 text-orange-700 hover:bg-orange-200"
//                                 }`}
//                               >
//                                 {isSuspended ? <><FiPlay size={11} /> Réactiver</> : <><FiPause size={11} /> Suspendre</>}
//                               </button>
//                             )}

//                             {/* Gérer (expand) */}
//                             <button
//                               onClick={() => setExpandedId(expandedId === election.id_election ? null : election.id_election)}
//                               className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold ${
//                                 expandedId === election.id_election
//                                   ? "bg-blue-700 text-white"
//                                   : "bg-blue-600 text-white hover:bg-blue-700"
//                               }`}
//                             >
//                               Admin {expandedId === election.id_election ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
//                             </button>

//                             {/* Supprimer */}
//                             {canEdit && (
//                               <button
//                                 onClick={() => handleDelete(election.id_election)}
//                                 className="inline-flex items-center px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 active:scale-95 transition-all text-xs"
//                                 title="Supprimer"
//                               >
//                                 <FiTrash2 size={12} />
//                               </button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>

//                       {/* Ligne expandée — changer l'admin */}
//                       {expandedId === election.id_election && (
//                         <tr className="bg-blue-50/60 border-b border-blue-100">
//                           <td colSpan="7" className="px-6 py-4">
//                             <div className="flex items-center gap-4 flex-wrap">
//                               <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
//                                 <FiUser size={14} /> Affecter un administrateur :
//                               </div>
//                               <select
//                                 defaultValue={election.admin_id}
//                                 onChange={e => handleChangeAdmin(election.id_election, e.target.value)}
//                                 className="border border-blue-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-52"
//                               >
//                                 <option value="">— Choisir un admin —</option>
//                                 {admins.map(a => (
//                                   <option key={a.id} value={a.id}>
//                                     {a.prenom} {a.nom} ({a.role === "ADMIN_ELECTION" ? "Admin" : "En attente"})
//                                   </option>
//                                 ))}
//                               </select>
//                               <p className="text-xs text-blue-400">
//                                 Admin actuel : <strong className="text-blue-600">{election.prenom_admin} {election.nom_admin}</strong>
//                               </p>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//       </main>
//     </div>
//   );
// }
