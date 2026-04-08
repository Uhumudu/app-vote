import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FiSend, FiRefreshCw, FiDownload, FiDollarSign,
  FiCheckCircle, FiXCircle, FiClock, FiSmartphone,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

// ── Helpers identiques à TransactionsCamPay ───────────────────────────────────
const formatDate   = (d) => d ? new Date(d).toLocaleString("fr-FR", { day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit" }) : "—";
const formatMontant = (n) => Number(n).toLocaleString("fr-FR") + " XAF";

const STATUT_CONFIG = {
  SUCCESSFUL: { label:"Confirmé",  icon:<FiCheckCircle size={12}/>, bg:"#dcfce7", color:"#15803d", border:"#bbf7d0", dot:"#22c55e" },
  PENDING:    { label:"En attente",icon:<FiClock size={12}/>,       bg:"#fef9c3", color:"#854d0e", border:"#fde047", dot:"#eab308" },
  FAILED:     { label:"Échoué",    icon:<FiXCircle size={12}/>,     bg:"#fee2e2", color:"#991b1b", border:"#fca5a5", dot:"#ef4444" },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.PENDING;
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:"5px",padding:"4px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700,background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,whiteSpace:"nowrap" }}>
      <span style={{ width:"6px",height:"6px",borderRadius:"50%",background:cfg.dot,animation:statut==="PENDING"?"pulse 1.5s infinite":"none" }}/>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── Formulaire de retrait ──────────────────────────────────────────────────────
function FormulaireRetrait({ onSuccess }) {
  const [form,      setForm]      = useState({ telephone:"237", montant:"", description:"" });
  const [loading,   setLoading]   = useState(false);
  const [polling,   setPolling]   = useState(false);
  const [error,     setError]     = useState("");
  const [reference, setReference] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const pollRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  useEffect(() => () => stopPolling(), []);

  const startPolling = (ref) => {
    setPolling(true);
    setStatusMsg("Vérification en cours…");
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await api.get(`/campay/statut-retrait/${ref}`);
        if (data.status === "SUCCESSFUL") {
          stopPolling(); setPolling(false);
          setStatusMsg("✅ Retrait confirmé !");
          onSuccess();
        } else if (data.status === "FAILED") {
          stopPolling(); setPolling(false);
          setStatusMsg("❌ Retrait échoué. Vérifiez le numéro ou le solde CamPay.");
        } else if (attempts >= 24) { // 2 min max
          stopPolling(); setPolling(false);
          setStatusMsg("⏱️ Délai dépassé. Vérifiez l'historique plus tard.");
        }
      } catch {
        stopPolling(); setPolling(false);
        setStatusMsg("Erreur de vérification.");
      }
    }, 5000);
  };

  const handleSubmit = async () => {
    setError(""); setStatusMsg("");
    if (!/^237[0-9]{9}$/.test(form.telephone)) {
      return setError("Numéro invalide. Format : 237XXXXXXXXX (ex: 2376XXXXXXXX)");
    }
    if (!form.montant || Number(form.montant) < 100) {
      return setError("Montant minimum : 100 XAF.");
    }
    setLoading(true);
    try {
      const { data } = await api.post("/campay/initier-retrait", {
        telephone:   form.telephone,
        montant:     Number(form.montant),
        description: form.description || undefined,
      });
      if (data.success) {
        setReference(data.campay_reference);
        setForm({ telephone:"237", montant:"", description:"" });
        startPolling(data.campay_reference);
      } else {
        setError(data.message || "Échec du retrait.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:"#fff",borderRadius:"16px",border:"1px solid #e0e7ff",padding:"24px",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",marginBottom:"24px" }}>
      <h3 style={{ margin:"0 0 20px",fontSize:"15px",fontWeight:800,color:"#1e3a5f" }}>
        💸 Initier un retrait
      </h3>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px" }}>
        {/* Téléphone */}
        <div>
          <label style={{ fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"6px" }}>
            Numéro Mobile Money
          </label>
          <div style={{ position:"relative" }}>
            <FiSmartphone size={14} style={{ position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
            <input
              type="text" value={form.telephone}
              onChange={e => setForm(f=>({...f,telephone:e.target.value}))}
              placeholder="237XXXXXXXXX"
              style={{ width:"100%",padding:"10px 12px 10px 34px",border:"1.5px solid #e2e8f0",borderRadius:"10px",fontSize:"13px",color:"#1e293b",background:"#f8fafc",outline:"none",boxSizing:"border-box",fontFamily:"monospace" }}
            />
          </div>
        </div>

        {/* Montant */}
        <div>
          <label style={{ fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"6px" }}>
            Montant (XAF)
          </label>
          <div style={{ position:"relative" }}>
            <FiDollarSign size={14} style={{ position:"absolute",left:"12px",top:"50%",transform:"translateY(-50%)",color:"#94a3b8" }}/>
            <input
              type="number" value={form.montant} min="100"
              onChange={e => setForm(f=>({...f,montant:e.target.value}))}
              placeholder="Ex: 5000"
              style={{ width:"100%",padding:"10px 12px 10px 34px",border:"1.5px solid #e2e8f0",borderRadius:"10px",fontSize:"13px",color:"#1e293b",background:"#f8fafc",outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom:"16px" }}>
        <label style={{ fontSize:"11px",fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".5px",display:"block",marginBottom:"6px" }}>
          Description (optionnel)
        </label>
        <input
          type="text" value={form.description}
          onChange={e => setForm(f=>({...f,description:e.target.value}))}
          placeholder="Ex: Retrait mensuel, remboursement…"
          style={{ width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:"10px",fontSize:"13px",color:"#1e293b",background:"#f8fafc",outline:"none",boxSizing:"border-box",fontFamily:"inherit" }}
        />
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"10px 14px",background:"#fee2e2",border:"1px solid #fca5a5",borderRadius:"10px",marginBottom:"14px" }}>
          <FiAlertCircle size={14} color="#ef4444"/>
          <span style={{ fontSize:"12px",color:"#991b1b",fontWeight:600 }}>{error}</span>
        </div>
      )}

      {/* Statut polling */}
      {statusMsg && (
        <div style={{ display:"flex",alignItems:"center",gap:"8px",padding:"10px 14px",background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"10px",marginBottom:"14px" }}>
          {polling && (
            <div style={{ width:"14px",height:"14px",border:"2px solid #c7d2fe",borderTop:"2px solid #6366f1",borderRadius:"50%",animation:"spin 1s linear infinite",flexShrink:0 }}/>
          )}
          <span style={{ fontSize:"12px",color:"#4338ca",fontWeight:600 }}>{statusMsg}</span>
          {reference && (
            <span style={{ fontSize:"10px",color:"#94a3b8",marginLeft:"auto",fontFamily:"monospace" }}>{reference}</span>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || polling}
        style={{
          display:"flex",alignItems:"center",gap:"8px",
          padding:"11px 22px",borderRadius:"10px",border:"none",
          background: loading || polling ? "#94a3b8" : "linear-gradient(135deg,#1a3fa8,#2356c7)",
          color:"#fff",fontSize:"13px",fontWeight:700,
          cursor: loading || polling ? "not-allowed" : "pointer",
          boxShadow: loading || polling ? "none" : "0 4px 14px rgba(35,86,199,0.35)",
          fontFamily:"inherit",
        }}
      >
        <FiSend size={13}/>
        {loading ? "Envoi…" : polling ? "En attente de confirmation…" : "Initier le retrait"}
      </button>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function RetraitCamPay() {
  const [retraits, setRetraits] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchRetraits = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/campay/retraits");
      setRetraits(data);
    } catch (err) {
      console.error("Erreur retraits:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRetraits(); }, [fetchRetraits]);

  // KPIs
  const kpis = {
    total:         retraits.length,
    succes:        retraits.filter(r => r.statut === "SUCCESSFUL").length,
    montantSorti:  retraits.filter(r => r.statut === "SUCCESSFUL").reduce((s,r) => s + Number(r.montant), 0),
    pending:       retraits.filter(r => r.statut === "PENDING").length,
  };

  const exportCSV = () => {
    const h = ["Référence","Téléphone","Montant","Description","Statut","Date","Date confirmation"];
    const rows = retraits.map(r => [r.campay_reference,r.telephone,r.montant,r.description||"",r.statut,formatDate(r.date_creation),formatDate(r.date_confirmation)]);
    const csv = [h,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="retraits_campay.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display:"flex",minHeight:"100vh",background:"linear-gradient(135deg,#dbeafe,#bfdbfe,#a5b4fc20)" }}>
      <SuperAdminSidebar active="retraits"/>
      <main style={{ flex:1,padding:"32px",overflowY:"auto" }}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"28px",flexWrap:"wrap",gap:"12px" }}>
          <div>
            <h2 style={{ fontSize:"22px",fontWeight:900,color:"#1e3a5f",margin:0 }}>Retraits Mobile</h2>
            <p style={{ fontSize:"13px",color:"#6366f1",margin:"4px 0 0",fontWeight:500 }}>💸 Virements sortants — Super Admin</p>
          </div>
          <div style={{ display:"flex",gap:"8px" }}>
            <button onClick={fetchRetraits} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"10px",border:"1.5px solid #c7d2fe",background:"#fff",color:"#6366f1",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
              <FiRefreshCw size={13}/> Actualiser
            </button>
            <button onClick={exportCSV} style={{ display:"flex",alignItems:"center",gap:"6px",padding:"9px 16px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#1a3fa8,#2356c7)",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(35,86,199,0.35)",fontFamily:"inherit" }}>
              <FiDownload size={13}/> Exporter CSV
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"28px" }}>
          {[
            { label:"Total retraits",  value:kpis.total,                                                         gradient:"linear-gradient(135deg,#1a3fa8,#2356c7)",  icon:<FiSend/> },
            { label:"Confirmés",       value:kpis.succes,                                                        gradient:"linear-gradient(135deg,#15803d,#16a34a)",  icon:<FiCheckCircle/> },
            { label:"En attente",      value:kpis.pending,                                                       gradient:"linear-gradient(135deg,#d97706,#f59e0b)",  icon:<FiClock/> },
            { label:"Montant sorti",   value:Number(kpis.montantSorti).toLocaleString("fr-FR")+" XAF",           gradient:"linear-gradient(135deg,#b91c1c,#dc2626)",  icon:<FiDollarSign/> },
          ].map(({ label,value,gradient,icon }) => (
            <div key={label} style={{ background:gradient,borderRadius:"16px",padding:"20px 22px",boxShadow:"0 4px 16px rgba(0,0,0,0.08)",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:"-10px",right:"-10px",width:"64px",height:"64px",borderRadius:"50%",background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",color:"rgba(255,255,255,0.7)" }}>{icon}</div>
              <p style={{ fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.75)",textTransform:"uppercase",letterSpacing:".7px",margin:0 }}>{label}</p>
              <p style={{ fontSize:"24px",fontWeight:900,color:"#fff",margin:"6px 0 0",lineHeight:1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <FormulaireRetrait onSuccess={fetchRetraits}/>

        {/* Tableau historique */}
        <div style={{ background:"#fff",borderRadius:"16px",border:"1px solid #e0e7ff",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",overflow:"hidden" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1.2fr 1fr 0.8fr 1.2fr 1fr 1fr",background:"linear-gradient(135deg,#1a3fa8,#2356c7)",padding:"12px 20px",gap:"8px" }}>
            {["Référence","Téléphone","Montant","Description","Statut","Date"].map((h,i) => (
              <p key={i} style={{ margin:0,fontSize:"11px",fontWeight:700,color:"rgba(255,255,255,0.8)",textTransform:"uppercase",letterSpacing:".6px" }}>{h}</p>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:"60px",textAlign:"center" }}>
              <div style={{ width:"36px",height:"36px",border:"3px solid #e0e7ff",borderTop:"3px solid #2356c7",borderRadius:"50%",margin:"0 auto 12px",animation:"spin 1s linear infinite" }}/>
              <p style={{ color:"#94a3b8",fontSize:"13px" }}>Chargement…</p>
            </div>
          ) : retraits.length === 0 ? (
            <div style={{ padding:"60px",textAlign:"center" }}>
              <p style={{ fontSize:"36px",margin:"0 0 12px" }}>💸</p>
              <p style={{ color:"#64748b",fontWeight:600,fontSize:"14px",margin:0 }}>Aucun retrait effectué</p>
            </div>
          ) : (
            retraits.map((r, idx) => (
              <div key={r.id_retrait} style={{ display:"grid",gridTemplateColumns:"1.2fr 1fr 0.8fr 1.2fr 1fr 1fr",padding:"14px 20px",gap:"8px",alignItems:"center",background:idx%2===0?"#fff":"#fafbff",borderBottom:"1px solid #f1f5f9" }}>
                <p style={{ margin:0,fontSize:"11px",fontWeight:700,color:"#6366f1",fontFamily:"monospace" }}>{r.campay_reference?.slice(0,14)}…</p>
                <p style={{ margin:0,fontSize:"12px",fontWeight:600,color:"#1e293b",fontFamily:"monospace" }}>{r.telephone}</p>
                <p style={{ margin:0,fontSize:"13px",fontWeight:800,color:"#1e3a5f" }}>{formatMontant(r.montant)}</p>
                <p style={{ margin:0,fontSize:"12px",color:"#475569",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{r.description||"—"}</p>
                <div><StatutBadge statut={r.statut}/></div>
                <p style={{ margin:0,fontSize:"11px",color:"#64748b" }}>{formatDate(r.date_creation)}</p>
              </div>
            ))
          )}
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}