// src/pages/admin/superadmin/TransactionsCamPay.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiRefreshCw, FiDownload, FiCheckCircle, FiXCircle,
  FiClock, FiSmartphone, FiCalendar, FiDollarSign, FiSend,
  FiSearch, FiUser,
} from "react-icons/fi";
import { BarChart3 } from "lucide-react";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

const formatMontant = (n) => Number(n || 0).toLocaleString("fr-FR") + " XAF";

const STATUT_CONFIG = {
  SUCCESSFUL: { label:"Confirmé",   bg:"#dcfce7", color:"#15803d", border:"#bbf7d0", dot:"#22c55e" },
  PENDING:    { label:"En attente", bg:"#fef9c3", color:"#854d0e", border:"#fde047", dot:"#eab308" },
  FAILED:     { label:"Échoué",     bg:"#fee2e2", color:"#991b1b", border:"#fca5a5", dot:"#ef4444" },
};

const TYPE_CONFIG = {
  CREATION_ELECTION: {
    label:    "Création d'élection",
    emoji:    "🗳️",
    bg:       "#eef2ff",
    color:    "#4f46e5",
    border:   "#c7d2fe",
  },
  VOTE_PUBLIC: {
    label:    "Vote public",
    emoji:    "✅",
    bg:       "#f0fdf4",
    color:    "#15803d",
    border:   "#bbf7d0",
  },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.PENDING;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"999px", fontSize:"11px", fontWeight:700, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, whiteSpace:"nowrap" }}>
      <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:cfg.dot, flexShrink:0, animation:statut==="PENDING"?"blink 1.4s infinite":"none" }}/>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.CREATION_ELECTION;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"8px", fontSize:"11px", fontWeight:700, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, whiteSpace:"nowrap" }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── Détail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ transaction: t, onClose }) {
  if (!t) return null;
  const statutCfg = STATUT_CONFIG[t.statut] || STATUT_CONFIG.PENDING;
  const typeCfg   = TYPE_CONFIG[t.type_transaction] || TYPE_CONFIG.CREATION_ELECTION;
  const isVote    = t.type_transaction === "VOTE_PUBLIC";

  // Données élection pour CREATION_ELECTION
  let electionData = null;
  if (!isVote && t.donnees_election) {
    try { electionData = JSON.parse(t.donnees_election); } catch {}
  }

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", backdropFilter:"blur(5px)", zIndex:999 }}/>
      <div style={{ position:"fixed", top:0, right:0, width:"440px", height:"100vh", background:"#fff", boxShadow:"-8px 0 48px rgba(0,0,0,0.18)", zIndex:1000, display:"flex", flexDirection:"column", overflowY:"auto" }}>

        {/* Header drawer */}
        <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)", padding:"28px 24px 22px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ fontSize:"10px", color:"rgba(255,255,255,0.55)", fontWeight:700, textTransform:"uppercase", letterSpacing:".8px", margin:"0 0 6px" }}>
                Détail transaction
              </p>
              <h3 style={{ fontSize:"14px", fontWeight:800, color:"#fff", margin:0, fontFamily:"monospace", wordBreak:"break-all" }}>
                {t.campay_reference}
              </h3>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"8px", color:"#fff", cursor:"pointer", padding:"6px 11px", fontSize:"16px", lineHeight:1, flexShrink:0 }}>
              ×
            </button>
          </div>
          <div style={{ display:"flex", gap:"8px", marginTop:"14px", flexWrap:"wrap" }}>
            <StatutBadge statut={t.statut}/>
            <TypeBadge type={t.type_transaction}/>
          </div>
        </div>

        <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:"20px" }}>

          {/* Montant */}
          <div style={{ background:t.statut==="SUCCESSFUL"?"#f0fdf4":"#f8fafc", border:`1.5px solid ${statutCfg.border}`, borderRadius:"14px", padding:"20px", textAlign:"center" }}>
            <p style={{ fontSize:"11px", color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:".5px", margin:"0 0 6px" }}>Montant</p>
            <p style={{ fontSize:"30px", fontWeight:900, color:statutCfg.color, margin:0 }}>{formatMontant(t.montant)}</p>
          </div>

          {/* Infos selon le type */}
          {isVote ? (
            // ── Vote public ──
            <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:"12px", padding:"16px" }}>
              <p style={{ fontSize:"11px", color:"#15803d", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", margin:"0 0 12px" }}>
                ✅ Détails du vote
              </p>
              <Row label="Élection"   value={t.election_titre || "—"}/>
              <Row label="Candidat"   value={t.candidat_prenom && t.candidat_nom ? `${t.candidat_prenom} ${t.candidat_nom}` : "—"}/>
              <Row label="Téléphone"  value={t.telephone_electeur || "—"}/>
              <Row label="Date vote"  value={formatDate(t.date_creation)}/>
            </div>
          ) : (
            // ── Création élection ──
            <div style={{ background:"#eef2ff", border:"1.5px solid #c7d2fe", borderRadius:"12px", padding:"16px" }}>
              <p style={{ fontSize:"11px", color:"#4f46e5", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", margin:"0 0 12px" }}>
                🗳️ Élection créée
              </p>
              {electionData ? (
                <>
                  <Row label="Titre"     value={electionData.titre || "—"}/>
                  <Row label="Type"      value={electionData.type  || "—"}/>
                  <Row label="Début"     value={formatDate(electionData.startDate)}/>
                  <Row label="Fin"       value={formatDate(electionData.endDate)}/>
                </>
              ) : (
                <p style={{ fontSize:"12px", color:"#94a3b8", margin:0 }}>Données non disponibles</p>
              )}
            </div>
          )}

          {/* Admin */}
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"12px", padding:"16px" }}>
            <p style={{ fontSize:"11px", color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", margin:"0 0 12px" }}>
              👤 Administrateur
            </p>
            <Row label="Nom"   value={`${t.admin_prenom || ""} ${t.admin_nom || ""}`.trim() || "—"}/>
            <Row label="Email" value={t.admin_email || "—"}/>
          </div>

          {/* Références */}
          <div style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:"12px", padding:"16px" }}>
            <p style={{ fontSize:"11px", color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:".5px", margin:"0 0 12px" }}>
              🔖 Références
            </p>
            <Row label="CamPay"   value={t.campay_reference || "—"} mono/>
            {t.external_reference && <Row label="Interne" value={t.external_reference} mono/>}
            <Row label="Créé le"  value={formatDate(t.date_creation)}/>
            {t.date_confirmation  && <Row label="Confirmé" value={formatDate(t.date_confirmation)}/>}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px", gap:"8px" }}>
      <span style={{ fontSize:"12px", color:"#94a3b8", flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:"12px", fontWeight:600, color:"#1e293b", textAlign:"right", wordBreak:"break-all", fontFamily:mono?"monospace":"inherit" }}>{value}</span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, gradient }) {
  return (
    <div style={{ background:gradient, borderRadius:"16px", padding:"20px 22px", boxShadow:"0 4px 16px rgba(0,0,0,0.10)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"-8px", right:"-8px", width:"60px", height:"60px", borderRadius:"50%", background:"rgba(255,255,255,0.13)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", color:"rgba(255,255,255,0.7)" }}>
        {icon}
      </div>
      <p style={{ fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:".7px", margin:"0 0 6px" }}>{label}</p>
      <p style={{ fontSize:"24px", fontWeight:900, color:"#fff", margin:0, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.6)", margin:"4px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function TransactionsCamPay() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState("TOUS");
  const [statutFilter, setStatutFilter] = useState("TOUS");
  const [selected,     setSelected]     = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/superadmin/transactions-campay");
      setTransactions(data);
    } catch (err) {
      console.error("Erreur transactions:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    let r = [...transactions];
    if (typeFilter   !== "TOUS") r = r.filter(t => t.type_transaction === typeFilter);
    if (statutFilter !== "TOUS") r = r.filter(t => t.statut === statutFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(t =>
        t.campay_reference?.toLowerCase().includes(q) ||
        t.admin_nom?.toLowerCase().includes(q) ||
        t.admin_prenom?.toLowerCase().includes(q) ||
        t.admin_email?.toLowerCase().includes(q) ||
        t.election_titre?.toLowerCase().includes(q) ||
        t.candidat_nom?.toLowerCase().includes(q) ||
        t.telephone_electeur?.includes(q)
      );
    }
    setFiltered(r);
  }, [transactions, search, typeFilter, statutFilter]);

  // KPIs
  const succes       = transactions.filter(t => t.statut === "SUCCESSFUL");
  const montantTotal = succes.reduce((s, t) => s + Number(t.montant || 0), 0);
  const nbCreations  = transactions.filter(t => t.type_transaction === "CREATION_ELECTION").length;
  const nbVotes      = transactions.filter(t => t.type_transaction === "VOTE_PUBLIC").length;

  const exportCSV = () => {
    const headers = ["Type","Référence CamPay","Admin","Email admin","Élection","Candidat","Téléphone","Montant (XAF)","Statut","Date"];
    const rows = filtered.map(t => [
      t.type_label || t.type_transaction,
      t.campay_reference || "",
      `${t.admin_prenom||""} ${t.admin_nom||""}`.trim(),
      t.admin_email || "",
      t.election_titre || (() => { try { return JSON.parse(t.donnees_election||"{}").titre||""; } catch{return "";} })(),
      t.candidat_nom ? `${t.candidat_prenom||""} ${t.candidat_nom}` : "",
      t.telephone_electeur || "",
      t.montant || "",
      t.statut,
      formatDate(t.date_creation),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type:"text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "transactions_campay.csv"; a.click();
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"linear-gradient(135deg,#f0f4ff,#e8eeff,#f5f0ff)" }}>
      <SuperAdminSidebar active="transactions"/>

      <main style={{ flex:1, padding:"32px", overflowY:"auto" }}>

        {/* ── En-tête ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"28px", flexWrap:"wrap", gap:"12px" }}>
          <div>
            <h2 style={{ fontSize:"22px", fontWeight:900, color:"#1e1b4b", margin:0 }}>
              Historique des Transactions
            </h2>
            <p style={{ fontSize:"13px", color:"#6366f1", margin:"4px 0 0", fontWeight:500 }}>
              💳 Frais de création d'élections &amp; Votes publics — Mobile Money
            </p>
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <button onClick={() => navigate("/admin/superadmin/retraits")} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px", borderRadius:"10px", border:"1.5px solid #a5b4fc", background:"#eef2ff", color:"#4f46e5", fontSize:"13px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              <FiSend size={13}/> Retraits
            </button>
            <button onClick={fetchTransactions} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px", borderRadius:"10px", border:"1.5px solid #c7d2fe", background:"#fff", color:"#6366f1", fontSize:"13px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              <FiRefreshCw size={13}/> Actualiser
            </button>
            <button onClick={exportCSV} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 16px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#4f46e5,#6366f1)", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(79,70,229,0.35)", fontFamily:"inherit" }}>
              <FiDownload size={13}/> Exporter CSV
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"28px" }}>
          <KpiCard label="Total transactions" value={transactions.length} sub="Toutes catégories" icon={<BarChart3 size={20}/>} gradient="linear-gradient(135deg,#4f46e5,#6366f1)"/>
          <KpiCard label="Créations élection" value={nbCreations} sub="Frais de création" icon="🗳️" gradient="linear-gradient(135deg,#7c3aed,#8b5cf6)"/>
          <KpiCard label="Votes publics" value={nbVotes} sub="Paiements de votes" icon="✅" gradient="linear-gradient(135deg,#059669,#10b981)"/>
          <KpiCard label="Revenus collectés" value={Number(montantTotal).toLocaleString("fr-FR") + " XAF"} sub="Transactions confirmées" icon={<FiDollarSign size={20}/>} gradient="linear-gradient(135deg,#d97706,#f59e0b)"/>
        </div>

        {/* ── Filtres ── */}
        <div style={{ background:"#fff", borderRadius:"14px", border:"1px solid #e0e7ff", padding:"14px 18px", marginBottom:"14px", display:"flex", gap:"12px", alignItems:"center", flexWrap:"wrap", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
          
          {/* Recherche */}
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <FiSearch size={13} style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}/>
            <input
              type="text" placeholder="Référence, nom, email, élection…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", padding:"8px 12px 8px 32px", border:"1.5px solid #e2e8f0", borderRadius:"9px", fontSize:"13px", color:"#1e293b", background:"#f8fafc", outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
            />
          </div>

          {/* Filtre type */}
          <div style={{ display:"flex", gap:"4px", background:"#f1f5f9", borderRadius:"9px", padding:"3px" }}>
            {[
              { key:"TOUS",              label:"Tout" },
              { key:"CREATION_ELECTION", label:"🗳️ Créations" },
              { key:"VOTE_PUBLIC",       label:"✅ Votes" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setTypeFilter(key)} style={{ padding:"5px 12px", borderRadius:"7px", border:"none", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:typeFilter===key?"#fff":"transparent", color:typeFilter===key?"#4f46e5":"#64748b", boxShadow:typeFilter===key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all .15s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtre statut */}
          <div style={{ display:"flex", gap:"4px", background:"#f1f5f9", borderRadius:"9px", padding:"3px" }}>
            {[
              { key:"TOUS",       label:"Tous statuts" },
              { key:"SUCCESSFUL", label:"Confirmés" },
              { key:"PENDING",    label:"En attente" },
              { key:"FAILED",     label:"Échoués" },
            ].map(({ key, label }) => {
              const cfg = STATUT_CONFIG[key];
              return (
                <button key={key} onClick={() => setStatutFilter(key)} style={{ padding:"5px 12px", borderRadius:"7px", border:"none", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:statutFilter===key?(cfg?.bg||"#fff"):"transparent", color:statutFilter===key?(cfg?.color||"#1e1b4b"):"#64748b", boxShadow:statutFilter===key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all .15s" }}>
                  {label}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize:"12px", color:"#94a3b8", margin:0, whiteSpace:"nowrap" }}>
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Tableau ── */}
        <div style={{ background:"#fff", borderRadius:"16px", border:"1px solid #e0e7ff", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", overflow:"hidden" }}>
          
          {/* Header tableau */}
          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1.2fr 1.4fr 1.6fr 0.8fr 1fr 0.9fr 0.4fr", background:"linear-gradient(135deg,#4f46e5,#6366f1)", padding:"12px 20px", gap:"8px" }}>
            {["Type","Référence","Administrateur","Détail","Montant","Statut","Date",""].map((h,i) => (
              <p key={i} style={{ margin:0, fontSize:"10px", fontWeight:700, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:".6px" }}>{h}</p>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:"60px", textAlign:"center" }}>
              <div style={{ width:"32px", height:"32px", border:"3px solid #e0e7ff", borderTop:"3px solid #6366f1", borderRadius:"50%", margin:"0 auto 12px", animation:"spin 1s linear infinite" }}/>
              <p style={{ color:"#94a3b8", fontSize:"13px" }}>Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:"60px", textAlign:"center" }}>
              <p style={{ fontSize:"36px", margin:"0 0 12px" }}>💳</p>
              <p style={{ color:"#64748b", fontWeight:600, fontSize:"14px", margin:0 }}>Aucune transaction trouvée</p>
              <p style={{ color:"#94a3b8", fontSize:"12px", marginTop:"4px" }}>Modifiez vos filtres.</p>
            </div>
          ) : (
            filtered.map((t, idx) => {
              const isVote = t.type_transaction === "VOTE_PUBLIC";

              // Ligne de détail contextuelle
              let detailLine1 = "";
              let detailLine2 = "";
              if (isVote) {
                detailLine1 = t.election_titre || "—";
                detailLine2 = t.candidat_prenom && t.candidat_nom ? `→ ${t.candidat_prenom} ${t.candidat_nom}` : "";
              } else {
                try {
                  const d = JSON.parse(t.donnees_election || "{}");
                  detailLine1 = d.titre || "—";
                  detailLine2 = d.type ? `Type : ${d.type}` : "";
                } catch {}
              }

              return (
                <div
                  key={`${t.type_transaction}-${t.id_transaction}`}
                  onClick={() => setSelected(t)}
                  style={{ display:"grid", gridTemplateColumns:"1.6fr 1.2fr 1.4fr 1.6fr 0.8fr 1fr 0.9fr 0.4fr", padding:"13px 20px", gap:"8px", alignItems:"center", background:idx%2===0?"#fff":"#fafbff", borderBottom:"1px solid #f1f5f9", cursor:"pointer", transition:"background .13s" }}
                  onMouseEnter={e => e.currentTarget.style.background="#eef2ff"}
                  onMouseLeave={e => e.currentTarget.style.background=idx%2===0?"#fff":"#fafbff"}
                >
                  {/* Type */}
                  <div><TypeBadge type={t.type_transaction}/></div>

                  {/* Référence */}
                  <div>
                    <p style={{ margin:0, fontSize:"11px", fontWeight:700, color:"#6366f1", fontFamily:"monospace" }}>
                      {(t.campay_reference||"").slice(0,12)}…
                    </p>
                    <p style={{ margin:0, fontSize:"10px", color:"#94a3b8" }}>#{t.id_transaction}</p>
                  </div>

                  {/* Admin */}
                  <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                    <div style={{ width:"26px", height:"26px", borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#6366f1,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, color:"#fff" }}>
                      {(t.admin_prenom?.[0]||"A").toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <p style={{ margin:0, fontSize:"11px", fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {`${t.admin_prenom||""} ${t.admin_nom||""}`.trim() || "—"}
                      </p>
                      <p style={{ margin:0, fontSize:"10px", color:"#94a3b8", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {t.admin_email||""}
                      </p>
                    </div>
                  </div>

                  {/* Détail contextuel */}
                  <div>
                    <p style={{ margin:0, fontSize:"11px", fontWeight:600, color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {detailLine1}
                    </p>
                    {detailLine2 && (
                      <p style={{ margin:0, fontSize:"10px", color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {detailLine2}
                      </p>
                    )}
                    {isVote && t.telephone_electeur && (
                      <p style={{ margin:0, fontSize:"10px", color:"#94a3b8", fontFamily:"monospace" }}>
                        {t.telephone_electeur}
                      </p>
                    )}
                  </div>

                  {/* Montant */}
                  <p style={{ margin:0, fontSize:"12px", fontWeight:800, color:"#1e1b4b" }}>
                    {formatMontant(t.montant)}
                  </p>

                  {/* Statut */}
                  <div><StatutBadge statut={t.statut}/></div>

                  {/* Date */}
                  <p style={{ margin:0, fontSize:"10px", color:"#64748b" }}>{formatDate(t.date_creation)}</p>

                  {/* Voir */}
                  <button onClick={e => { e.stopPropagation(); setSelected(t); }} style={{ padding:"4px 9px", borderRadius:"7px", border:"1px solid #e0e7ff", background:"#eef2ff", color:"#6366f1", fontSize:"10px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                    Voir
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>

      <DetailDrawer transaction={selected} onClose={() => setSelected(null)}/>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}



