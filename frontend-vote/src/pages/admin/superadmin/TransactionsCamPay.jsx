// src/pages/admin/superadmin/TransactionsCamPay.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch, FiRefreshCw, FiDownload, FiFilter,
  FiCheckCircle, FiXCircle, FiClock, FiSmartphone,
  FiUser, FiCalendar, FiTrendingUp, FiDollarSign, FiSend,
} from "react-icons/fi";
import api from "../../../services/api";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const formatMontant = (n) =>
  Number(n).toLocaleString("fr-FR") + " XAF";

// ── Statut badge ──────────────────────────────────────────────────────────────
const STATUT_CONFIG = {
  SUCCESSFUL: {
    label: "Confirmé",
    icon: <FiCheckCircle size={12} />,
    bg: "#dcfce7", color: "#15803d", border: "#bbf7d0",
    dot: "#22c55e",
  },
  PENDING: {
    label: "En attente",
    icon: <FiClock size={12} />,
    bg: "#fef9c3", color: "#854d0e", border: "#fde047",
    dot: "#eab308",
  },
  FAILED: {
    label: "Échoué",
    icon: <FiXCircle size={12} />,
    bg: "#fee2e2", color: "#991b1b", border: "#fca5a5",
    dot: "#ef4444",
  },
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.PENDING;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "4px 10px", borderRadius: "999px",
        fontSize: "11px", fontWeight: 700,
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: cfg.dot, flexShrink: 0,
          animation: statut === "PENDING" ? "pulse 1.5s infinite" : "none",
        }}
      />
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, gradient }) {
  return (
    <div
      style={{
        background: gradient,
        borderRadius: "16px",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", top: "-10px", right: "-10px",
          width: "64px", height: "64px", borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", color: "rgba(255,255,255,0.7)",
        }}
      >
        {icon}
      </div>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: ".7px", margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: "26px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Détail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ transaction, onClose }) {
  if (!transaction) return null;
  const cfg = STATUT_CONFIG[transaction.statut] || STATUT_CONFIG.PENDING;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: "fixed", top: 0, right: 0,
          width: "420px", height: "100vh",
          background: "#fff",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.16)",
          zIndex: 1000,
          display: "flex", flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1a3fa8, #2356c7)",
            padding: "28px 24px 24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", margin: "0 0 6px" }}>
                Détails de la transaction
              </p>
              <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
                {transaction.campay_reference}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "8px", color: "#fff", cursor: "pointer",
                padding: "6px 10px", fontSize: "16px", lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ marginTop: "16px" }}>
            <StatutBadge statut={transaction.statut} />
          </div>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              background: transaction.statut === "SUCCESSFUL" ? "#f0fdf4" : "#f8fafc",
              border: `1.5px solid ${cfg.border}`,
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", margin: "0 0 6px" }}>
              Montant
            </p>
            <p style={{ fontSize: "32px", fontWeight: 900, color: cfg.color, margin: 0 }}>
              {formatMontant(transaction.montant)}
            </p>
          </div>

          {[
            { icon: <FiUser size={14} />, label: "Administrateur", value: `${transaction.admin_prenom || ""} ${transaction.admin_nom || ""}`.trim() || "—" },
            { icon: <FiSmartphone size={14} />, label: "Email admin", value: transaction.admin_email || "—" },
            { icon: <FiCalendar size={14} />, label: "Date de création", value: formatDate(transaction.date_creation) },
            { icon: <FiCheckCircle size={14} />, label: "Date de confirmation", value: formatDate(transaction.date_confirmation) },
            { icon: "🏦", label: "Référence CamPay", value: transaction.campay_reference },
            { icon: "🔖", label: "Référence interne", value: transaction.external_reference || "—" },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "32px", height: "32px", flexShrink: 0,
                  background: "#eef2ff", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#6366f1", fontSize: typeof icon === "string" ? "14px" : "inherit",
                }}
              >
                {icon}
              </div>
              <div>
                <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 2px" }}>
                  {label}
                </p>
                <p style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600, margin: 0, wordBreak: "break-all" }}>
                  {value}
                </p>
              </div>
            </div>
          ))}

          {transaction.donnees_election && (() => {
            let parsed = null;
            try { parsed = JSON.parse(transaction.donnees_election); } catch {}
            if (!parsed) return null;
            return (
              <div
                style={{
                  background: "#eef2ff", borderRadius: "12px",
                  padding: "16px", border: "1px solid #c7d2fe",
                }}
              >
                <p style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", margin: "0 0 10px" }}>
                  🗳️ Élection associée
                </p>
                {[
                  ["Titre", parsed.titre],
                  ["Type", parsed.type],
                  ["Date début", formatDate(parsed.startDate)],
                  ["Date fin", formatDate(parsed.endDate)],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{k}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#3730a3" }}>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </>
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
  const [statutFilter, setStatutFilter] = useState("TOUS");
  const [selected,     setSelected]     = useState(null);
  const [kpis,         setKpis]         = useState({ total: 0, succes: 0, echecs: 0, montantTotal: 0 });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/superadmin/transactions-campay");
      setTransactions(data);
      const succes       = data.filter(t => t.statut === "SUCCESSFUL");
      const echecs       = data.filter(t => t.statut === "FAILED");
      const montantTotal = succes.reduce((sum, t) => sum + Number(t.montant), 0);
      setKpis({ total: data.length, succes: succes.length, echecs: echecs.length, montantTotal });
    } catch (err) {
      console.error("Erreur transactions:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    let result = [...transactions];
    if (statutFilter !== "TOUS") result = result.filter(t => t.statut === statutFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.campay_reference?.toLowerCase().includes(q) ||
        t.admin_nom?.toLowerCase().includes(q) ||
        t.admin_prenom?.toLowerCase().includes(q) ||
        t.admin_email?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [transactions, search, statutFilter]);

  const exportCSV = () => {
    const headers = ["Référence CamPay", "Admin", "Email", "Montant (XAF)", "Statut", "Date création", "Date confirmation"];
    const rows = filtered.map(t => [
      t.campay_reference,
      `${t.admin_prenom || ""} ${t.admin_nom || ""}`.trim(),
      t.admin_email || "",
      t.montant,
      t.statut,
      formatDate(t.date_creation),
      formatDate(t.date_confirmation),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transactions_campay.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const STATUT_TABS = ["TOUS", "SUCCESSFUL", "PENDING", "FAILED"];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#dbeafe,#bfdbfe,#a5b4fc20)" }}>
      <SuperAdminSidebar active="transactions" />

      <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>

        {/* ── En-tête ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#1e3a5f", margin: 0, letterSpacing: "-0.3px" }}>
              Historique des Transactions
            </h2>
            <p style={{ fontSize: "13px", color: "#6366f1", margin: "4px 0 0", fontWeight: 500 }}>
              💳 Paiements CamPay — Frais de création d'élection
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {/* ── Raccourci Retraits ── */}
            <button
              onClick={() => navigate("/admin/superadmin/retraits")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", borderRadius: "10px",
                border: "1.5px solid #a5b4fc", background: "#eef2ff",
                color: "#4f46e5", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all .2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#e0e7ff";
                e.currentTarget.style.borderColor = "#818cf8";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#eef2ff";
                e.currentTarget.style.borderColor = "#a5b4fc";
              }}
            >
              <FiSend size={13} /> Retraits
            </button>

            <button
              onClick={fetchTransactions}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", borderRadius: "10px",
                border: "1.5px solid #c7d2fe", background: "#fff",
                color: "#6366f1", fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all .2s",
              }}
            >
              <FiRefreshCw size={13} /> Actualiser
            </button>
            <button
              onClick={exportCSV}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "9px 16px", borderRadius: "10px",
                border: "none",
                background: "linear-gradient(135deg, #1a3fa8, #2356c7)",
                color: "#fff", fontSize: "13px", fontWeight: 700,
                cursor: "pointer", boxShadow: "0 4px 14px rgba(35,86,199,0.35)",
              }}
            >
              <FiDownload size={13} /> Exporter CSV
            </button>
          </div>
        </div>

        {/* ── Bannière raccourci retrait ── */}
        <div
          onClick={() => navigate("/admin/superadmin/retraits")}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, #4f46e5, #6366f1)",
            borderRadius: "14px", padding: "16px 22px",
            marginBottom: "24px", cursor: "pointer",
            boxShadow: "0 4px 18px rgba(99,102,241,0.3)",
            transition: "transform .18s, box-shadow .18s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.4)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(99,102,241,0.3)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
              <FiSend size={18} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#fff" }}>
                Effectuer un retrait
              </p>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                Virer des fonds vers un compte Mobile Money via CamPay
              </p>
            </div>
          </div>
          <div style={{
            fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.9)",
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "8px", padding: "5px 12px", whiteSpace: "nowrap",
          }}>
            Accéder →
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
          <KpiCard
            label="Total transactions"
            value={kpis.total}
            sub="Toutes périodes"
            icon={<FiFilter />}
            gradient="linear-gradient(135deg,#1a3fa8,#2356c7)"
          />
          <KpiCard
            label="Confirmées"
            value={kpis.succes}
            sub={`${kpis.total ? Math.round((kpis.succes / kpis.total) * 100) : 0}% du total`}
            icon={<FiCheckCircle />}
            gradient="linear-gradient(135deg,#15803d,#16a34a)"
          />
          <KpiCard
            label="Échouées"
            value={kpis.echecs}
            sub="Paiements rejetés"
            icon={<FiXCircle />}
            gradient="linear-gradient(135deg,#b91c1c,#dc2626)"
          />
          <KpiCard
            label="Revenus collectés"
            value={Number(kpis.montantTotal).toLocaleString("fr-FR") + " XAF"}
            sub="Transactions confirmées"
            icon={<FiDollarSign />}
            gradient="linear-gradient(135deg,#d97706,#f59e0b)"
          />
        </div>

        {/* ── Filtres ── */}
        <div
          style={{
            background: "#fff", borderRadius: "16px",
            border: "1px solid #e0e7ff",
            padding: "16px 20px", marginBottom: "16px",
            display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <FiSearch size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Rechercher par référence, nom ou email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 34px",
                border: "1.5px solid #e2e8f0", borderRadius: "10px",
                fontSize: "13px", color: "#1e293b", background: "#f8fafc",
                outline: "none", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "3px" }}>
            {STATUT_TABS.map(tab => {
              const cfg = STATUT_CONFIG[tab];
              const isActive = statutFilter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setStatutFilter(tab)}
                  style={{
                    padding: "6px 14px", borderRadius: "8px", border: "none",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    transition: "all .18s",
                    background: isActive ? (cfg?.bg || "#fff") : "transparent",
                    color: isActive ? (cfg?.color || "#1e3a5f") : "#64748b",
                    boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                    fontFamily: "inherit",
                  }}
                >
                  {tab === "TOUS" ? "Tous" : cfg?.label}
                </button>
              );
            })}
          </div>

          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, whiteSpace: "nowrap" }}>
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* ── Tableau ── */}
        <div
          style={{
            background: "#fff", borderRadius: "16px",
            border: "1px solid #e0e7ff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr 1.2fr 0.8fr 1fr 1fr 0.5fr",
              background: "linear-gradient(135deg, #1a3fa8, #2356c7)",
              padding: "12px 20px",
              gap: "8px",
            }}
          >
            {["Référence", "Administrateur", "Élection", "Montant", "Statut", "Date", ""].map((h, i) => (
              <p key={i} style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: ".6px" }}>
                {h}
              </p>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <div style={{
                width: "36px", height: "36px", border: "3px solid #e0e7ff",
                borderTop: "3px solid #2356c7", borderRadius: "50%",
                margin: "0 auto 12px", animation: "spin 1s linear infinite",
              }} />
              <p style={{ color: "#94a3b8", fontSize: "13px" }}>Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <p style={{ fontSize: "36px", margin: "0 0 12px" }}>💳</p>
              <p style={{ color: "#64748b", fontWeight: 600, fontSize: "14px", margin: 0 }}>Aucune transaction trouvée</p>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>Modifiez vos filtres ou attendez les premiers paiements.</p>
            </div>
          ) : (
            filtered.map((t, idx) => {
              let electionTitre = "—";
              try {
                const d = JSON.parse(t.donnees_election || "{}");
                electionTitre = d.titre || "—";
              } catch {}

              return (
                <div
                  key={t.id_transaction}
                  onClick={() => setSelected(t)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.4fr 1.2fr 0.8fr 1fr 1fr 0.5fr",
                    padding: "14px 20px",
                    gap: "8px",
                    alignItems: "center",
                    background: idx % 2 === 0 ? "#fff" : "#fafbff",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: "pointer",
                    transition: "background .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafbff"}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
                      {t.campay_reference?.slice(0, 14)}…
                    </p>
                    <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>
                      ID #{t.id_transaction}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "10px", fontWeight: 800, color: "#fff",
                    }}>
                      {(t.admin_prenom?.[0] || "A").toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {`${t.admin_prenom || ""} ${t.admin_nom || ""}`.trim() || "—"}
                      </p>
                      <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.admin_email || ""}
                      </p>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "12px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {electionTitre}
                  </p>

                  <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#1e3a5f" }}>
                    {formatMontant(t.montant)}
                  </p>

                  <div><StatutBadge statut={t.statut} /></div>

                  <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                    {formatDate(t.date_creation)}
                  </p>

                  <button
                    onClick={e => { e.stopPropagation(); setSelected(t); }}
                    style={{
                      padding: "5px 10px", borderRadius: "8px",
                      border: "1px solid #e0e7ff", background: "#eef2ff",
                      color: "#6366f1", fontSize: "11px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Voir
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>

      <DetailDrawer transaction={selected} onClose={() => setSelected(null)} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}



































// // src/pages/admin/superadmin/TransactionsCamPay.jsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   FiSearch, FiRefreshCw, FiDownload, FiFilter,
//   FiCheckCircle, FiXCircle, FiClock, FiSmartphone,
//   FiUser, FiCalendar, FiTrendingUp, FiDollarSign,
// } from "react-icons/fi";
// import api from "../../../services/api";
// import SuperAdminSidebar from "../../../components/SuperAdminSidebar";

// // ── Helpers ───────────────────────────────────────────────────────────────────
// const formatDate = (d) =>
//   d
//     ? new Date(d).toLocaleString("fr-FR", {
//         day: "2-digit", month: "2-digit", year: "numeric",
//         hour: "2-digit", minute: "2-digit",
//       })
//     : "—";

// const formatMontant = (n) =>
//   Number(n).toLocaleString("fr-FR") + " XAF";

// // ── Statut badge ──────────────────────────────────────────────────────────────
// const STATUT_CONFIG = {
//   SUCCESSFUL: {
//     label: "Confirmé",
//     icon: <FiCheckCircle size={12} />,
//     bg: "#dcfce7", color: "#15803d", border: "#bbf7d0",
//     dot: "#22c55e",
//   },
//   PENDING: {
//     label: "En attente",
//     icon: <FiClock size={12} />,
//     bg: "#fef9c3", color: "#854d0e", border: "#fde047",
//     dot: "#eab308",
//   },
//   FAILED: {
//     label: "Échoué",
//     icon: <FiXCircle size={12} />,
//     bg: "#fee2e2", color: "#991b1b", border: "#fca5a5",
//     dot: "#ef4444",
//   },
// };

// function StatutBadge({ statut }) {
//   const cfg = STATUT_CONFIG[statut] || STATUT_CONFIG.PENDING;
//   return (
//     <span
//       style={{
//         display: "inline-flex", alignItems: "center", gap: "5px",
//         padding: "4px 10px", borderRadius: "999px",
//         fontSize: "11px", fontWeight: 700,
//         background: cfg.bg, color: cfg.color,
//         border: `1px solid ${cfg.border}`,
//         whiteSpace: "nowrap",
//       }}
//     >
//       <span
//         style={{
//           width: "6px", height: "6px", borderRadius: "50%",
//           background: cfg.dot, flexShrink: 0,
//           animation: statut === "PENDING" ? "pulse 1.5s infinite" : "none",
//         }}
//       />
//       {cfg.icon}
//       {cfg.label}
//     </span>
//   );
// }

// // ── KPI Card ──────────────────────────────────────────────────────────────────
// function KpiCard({ label, value, sub, icon, gradient, textColor }) {
//   return (
//     <div
//       style={{
//         background: gradient,
//         borderRadius: "16px",
//         padding: "20px 22px",
//         display: "flex",
//         flexDirection: "column",
//         gap: "6px",
//         boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
//         position: "relative",
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           position: "absolute", top: "-10px", right: "-10px",
//           width: "64px", height: "64px", borderRadius: "50%",
//           background: "rgba(255,255,255,0.12)",
//           display: "flex", alignItems: "center", justifyContent: "center",
//           fontSize: "22px", color: "rgba(255,255,255,0.7)",
//         }}
//       >
//         {icon}
//       </div>
//       <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: ".7px", margin: 0 }}>
//         {label}
//       </p>
//       <p style={{ fontSize: "26px", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1 }}>
//         {value}
//       </p>
//       {sub && (
//         <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", margin: 0 }}>
//           {sub}
//         </p>
//       )}
//     </div>
//   );
// }

// // ── Détail drawer ─────────────────────────────────────────────────────────────
// function DetailDrawer({ transaction, onClose }) {
//   if (!transaction) return null;
//   const cfg = STATUT_CONFIG[transaction.statut] || STATUT_CONFIG.PENDING;

//   return (
//     <>
//       {/* Overlay */}
//       <div
//         onClick={onClose}
//         style={{
//           position: "fixed", inset: 0,
//           background: "rgba(15,23,42,0.5)",
//           backdropFilter: "blur(4px)",
//           zIndex: 999,
//         }}
//       />
//       {/* Drawer */}
//       <div
//         style={{
//           position: "fixed", top: 0, right: 0,
//           width: "420px", height: "100vh",
//           background: "#fff",
//           boxShadow: "-8px 0 40px rgba(0,0,0,0.16)",
//           zIndex: 1000,
//           display: "flex", flexDirection: "column",
//           overflowY: "auto",
//         }}
//       >
//         {/* Header drawer */}
//         <div
//           style={{
//             background: "linear-gradient(135deg, #1a3fa8, #2356c7)",
//             padding: "28px 24px 24px",
//           }}
//         >
//           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//             <div>
//               <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", margin: "0 0 6px" }}>
//                 Détails de la transaction
//               </p>
//               <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#fff", margin: 0 }}>
//                 {transaction.campay_reference}
//               </h3>
//             </div>
//             <button
//               onClick={onClose}
//               style={{
//                 background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
//                 borderRadius: "8px", color: "#fff", cursor: "pointer",
//                 padding: "6px 10px", fontSize: "16px", lineHeight: 1,
//               }}
//             >
//               ×
//             </button>
//           </div>
//           <div style={{ marginTop: "16px" }}>
//             <StatutBadge statut={transaction.statut} />
//           </div>
//         </div>

//         {/* Contenu */}
//         <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>

//           {/* Montant */}
//           <div
//             style={{
//               background: transaction.statut === "SUCCESSFUL" ? "#f0fdf4" : "#f8fafc",
//               border: `1.5px solid ${cfg.border}`,
//               borderRadius: "14px",
//               padding: "20px",
//               textAlign: "center",
//             }}
//           >
//             <p style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase", margin: "0 0 6px" }}>
//               Montant
//             </p>
//             <p style={{ fontSize: "32px", fontWeight: 900, color: cfg.color, margin: 0 }}>
//               {formatMontant(transaction.montant)}
//             </p>
//           </div>

//           {/* Infos principales */}
//           {[
//             { icon: <FiUser size={14} />, label: "Administrateur", value: `${transaction.admin_prenom || ""} ${transaction.admin_nom || ""}`.trim() || "—" },
//             { icon: <FiSmartphone size={14} />, label: "Email admin", value: transaction.admin_email || "—" },
//             { icon: <FiCalendar size={14} />, label: "Date de création", value: formatDate(transaction.date_creation) },
//             { icon: <FiCheckCircle size={14} />, label: "Date de confirmation", value: formatDate(transaction.date_confirmation) },
//             { icon: "🏦", label: "Référence CamPay", value: transaction.campay_reference },
//             { icon: "🔖", label: "Référence interne", value: transaction.external_reference || "—" },
//           ].map(({ icon, label, value }) => (
//             <div key={label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
//               <div
//                 style={{
//                   width: "32px", height: "32px", flexShrink: 0,
//                   background: "#eef2ff", borderRadius: "8px",
//                   display: "flex", alignItems: "center", justifyContent: "center",
//                   color: "#6366f1", fontSize: typeof icon === "string" ? "14px" : "inherit",
//                 }}
//               >
//                 {icon}
//               </div>
//               <div>
//                 <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", margin: "0 0 2px" }}>
//                   {label}
//                 </p>
//                 <p style={{ fontSize: "13px", color: "#1e293b", fontWeight: 600, margin: 0, wordBreak: "break-all" }}>
//                   {value}
//                 </p>
//               </div>
//             </div>
//           ))}

//           {/* Élection associée */}
//           {transaction.donnees_election && (() => {
//             let parsed = null;
//             try { parsed = JSON.parse(transaction.donnees_election); } catch {}
//             if (!parsed) return null;
//             return (
//               <div
//                 style={{
//                   background: "#eef2ff", borderRadius: "12px",
//                   padding: "16px", border: "1px solid #c7d2fe",
//                 }}
//               >
//                 <p style={{ fontSize: "11px", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", margin: "0 0 10px" }}>
//                   🗳️ Élection associée
//                 </p>
//                 {[
//                   ["Titre", parsed.titre],
//                   ["Type", parsed.type],
//                   ["Date début", formatDate(parsed.startDate)],
//                   ["Date fin", formatDate(parsed.endDate)],
//                 ].filter(([, v]) => v).map(([k, v]) => (
//                   <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
//                     <span style={{ fontSize: "12px", color: "#64748b" }}>{k}</span>
//                     <span style={{ fontSize: "12px", fontWeight: 600, color: "#3730a3" }}>{v}</span>
//                   </div>
//                 ))}
//               </div>
//             );
//           })()}
//         </div>
//       </div>
//     </>
//   );
// }

// // ══════════════════════════════════════════════════════════════════════════════
// // PAGE PRINCIPALE
// // ══════════════════════════════════════════════════════════════════════════════
// export default function TransactionsCamPay() {
//   const [transactions, setTransactions] = useState([]);
//   const [filtered,     setFiltered]     = useState([]);
//   const [loading,      setLoading]      = useState(true);
//   const [search,       setSearch]       = useState("");
//   const [statutFilter, setStatutFilter] = useState("TOUS");
//   const [selected,     setSelected]     = useState(null);
//   const [kpis,         setKpis]         = useState({ total: 0, succes: 0, echecs: 0, montantTotal: 0 });

//   const fetchTransactions = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data } = await api.get("/superadmin/transactions-campay");
//       setTransactions(data);
//       // Calcul KPIs
//       const succes      = data.filter(t => t.statut === "SUCCESSFUL");
//       const echecs      = data.filter(t => t.statut === "FAILED");
//       const montantTotal = succes.reduce((sum, t) => sum + Number(t.montant), 0);
//       setKpis({ total: data.length, succes: succes.length, echecs: echecs.length, montantTotal });
//     } catch (err) {
//       console.error("Erreur transactions:", err.response?.data || err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

//   // Filtrage dynamique
//   useEffect(() => {
//     let result = [...transactions];
//     if (statutFilter !== "TOUS") result = result.filter(t => t.statut === statutFilter);
//     if (search.trim()) {
//       const q = search.toLowerCase();
//       result = result.filter(t =>
//         t.campay_reference?.toLowerCase().includes(q) ||
//         t.admin_nom?.toLowerCase().includes(q) ||
//         t.admin_prenom?.toLowerCase().includes(q) ||
//         t.admin_email?.toLowerCase().includes(q)
//       );
//     }
//     setFiltered(result);
//   }, [transactions, search, statutFilter]);

//   // Export CSV
//   const exportCSV = () => {
//     const headers = ["Référence CamPay", "Admin", "Email", "Montant (XAF)", "Statut", "Date création", "Date confirmation"];
//     const rows = filtered.map(t => [
//       t.campay_reference,
//       `${t.admin_prenom || ""} ${t.admin_nom || ""}`.trim(),
//       t.admin_email || "",
//       t.montant,
//       t.statut,
//       formatDate(t.date_creation),
//       formatDate(t.date_confirmation),
//     ]);
//     const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
//     const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url; a.download = "transactions_campay.csv"; a.click();
//     URL.revokeObjectURL(url);
//   };

//   const STATUT_TABS = ["TOUS", "SUCCESSFUL", "PENDING", "FAILED"];

//   return (
//     <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(135deg,#dbeafe,#bfdbfe,#a5b4fc20)" }}>
//       <SuperAdminSidebar active="transactions" />

//       <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>

//         {/* ── En-tête ── */}
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
//           <div>
//             <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#1e3a5f", margin: 0, letterSpacing: "-0.3px" }}>
//               Historique des Transactions
//             </h2>
//             <p style={{ fontSize: "13px", color: "#6366f1", margin: "4px 0 0", fontWeight: 500 }}>
//               💳 Paiements CamPay — Frais de création d'élection
//             </p>
//           </div>
//           <div style={{ display: "flex", gap: "8px" }}>
//             <button
//               onClick={fetchTransactions}
//               style={{
//                 display: "flex", alignItems: "center", gap: "6px",
//                 padding: "9px 16px", borderRadius: "10px",
//                 border: "1.5px solid #c7d2fe", background: "#fff",
//                 color: "#6366f1", fontSize: "13px", fontWeight: 600,
//                 cursor: "pointer", transition: "all .2s",
//               }}
//             >
//               <FiRefreshCw size={13} /> Actualiser
//             </button>
//             <button
//               onClick={exportCSV}
//               style={{
//                 display: "flex", alignItems: "center", gap: "6px",
//                 padding: "9px 16px", borderRadius: "10px",
//                 border: "none",
//                 background: "linear-gradient(135deg, #1a3fa8, #2356c7)",
//                 color: "#fff", fontSize: "13px", fontWeight: 700,
//                 cursor: "pointer", boxShadow: "0 4px 14px rgba(35,86,199,0.35)",
//               }}
//             >
//               <FiDownload size={13} /> Exporter CSV
//             </button>
//           </div>
//         </div>

//         {/* ── KPI Cards ── */}
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "28px" }}>
//           <KpiCard
//             label="Total transactions"
//             value={kpis.total}
//             sub="Toutes périodes"
//             icon={<FiFilter />}
//             gradient="linear-gradient(135deg,#1a3fa8,#2356c7)"
//           />
//           <KpiCard
//             label="Confirmées"
//             value={kpis.succes}
//             sub={`${kpis.total ? Math.round((kpis.succes/kpis.total)*100) : 0}% du total`}
//             icon={<FiCheckCircle />}
//             gradient="linear-gradient(135deg,#15803d,#16a34a)"
//           />
//           <KpiCard
//             label="Échouées"
//             value={kpis.echecs}
//             sub="Paiements rejetés"
//             icon={<FiXCircle />}
//             gradient="linear-gradient(135deg,#b91c1c,#dc2626)"
//           />
//           <KpiCard
//             label="Revenus collectés"
//             value={Number(kpis.montantTotal).toLocaleString("fr-FR") + " XAF"}
//             sub="Transactions confirmées"
//             icon={<FiDollarSign />}
//             gradient="linear-gradient(135deg,#d97706,#f59e0b)"
//           />
//         </div>

//         {/* ── Filtres ── */}
//         <div
//           style={{
//             background: "#fff", borderRadius: "16px",
//             border: "1px solid #e0e7ff",
//             padding: "16px 20px", marginBottom: "16px",
//             display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
//           }}
//         >
//           {/* Barre de recherche */}
//           <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
//             <FiSearch size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
//             <input
//               type="text"
//               placeholder="Rechercher par référence, nom ou email…"
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               style={{
//                 width: "100%", padding: "9px 12px 9px 34px",
//                 border: "1.5px solid #e2e8f0", borderRadius: "10px",
//                 fontSize: "13px", color: "#1e293b", background: "#f8fafc",
//                 outline: "none", boxSizing: "border-box",
//                 fontFamily: "inherit",
//               }}
//             />
//           </div>

//           {/* Tabs statut */}
//           <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "10px", padding: "3px" }}>
//             {STATUT_TABS.map(tab => {
//               const cfg = STATUT_CONFIG[tab];
//               const isActive = statutFilter === tab;
//               return (
//                 <button
//                   key={tab}
//                   onClick={() => setStatutFilter(tab)}
//                   style={{
//                     padding: "6px 14px", borderRadius: "8px", border: "none",
//                     fontSize: "12px", fontWeight: 700, cursor: "pointer",
//                     transition: "all .18s",
//                     background: isActive ? (cfg?.bg || "#fff") : "transparent",
//                     color: isActive ? (cfg?.color || "#1e3a5f") : "#64748b",
//                     boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
//                     fontFamily: "inherit",
//                   }}
//                 >
//                   {tab === "TOUS" ? "Tous" : cfg?.label}
//                 </button>
//               );
//             })}
//           </div>

//           <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0, whiteSpace: "nowrap" }}>
//             {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
//           </p>
//         </div>

//         {/* ── Tableau ── */}
//         <div
//           style={{
//             background: "#fff", borderRadius: "16px",
//             border: "1px solid #e0e7ff",
//             boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
//             overflow: "hidden",
//           }}
//         >
//           {/* Header tableau */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "1fr 1.4fr 1.2fr 0.8fr 1fr 1fr 0.5fr",
//               background: "linear-gradient(135deg, #1a3fa8, #2356c7)",
//               padding: "12px 20px",
//               gap: "8px",
//             }}
//           >
//             {["Référence", "Administrateur", "Élection", "Montant", "Statut", "Date", ""].map((h, i) => (
//               <p key={i} style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: ".6px" }}>
//                 {h}
//               </p>
//             ))}
//           </div>

//           {/* Contenu */}
//           {loading ? (
//             <div style={{ padding: "60px", textAlign: "center" }}>
//               <div style={{
//                 width: "36px", height: "36px", border: "3px solid #e0e7ff",
//                 borderTop: "3px solid #2356c7", borderRadius: "50%",
//                 margin: "0 auto 12px", animation: "spin 1s linear infinite",
//               }} />
//               <p style={{ color: "#94a3b8", fontSize: "13px" }}>Chargement…</p>
//             </div>
//           ) : filtered.length === 0 ? (
//             <div style={{ padding: "60px", textAlign: "center" }}>
//               <p style={{ fontSize: "36px", margin: "0 0 12px" }}>💳</p>
//               <p style={{ color: "#64748b", fontWeight: 600, fontSize: "14px", margin: 0 }}>Aucune transaction trouvée</p>
//               <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>Modifiez vos filtres ou attendez les premiers paiements.</p>
//             </div>
//           ) : (
//             filtered.map((t, idx) => {
//               let electionTitre = "—";
//               try {
//                 const d = JSON.parse(t.donnees_election || "{}");
//                 electionTitre = d.titre || "—";
//               } catch {}

//               return (
//                 <div
//                   key={t.id_transaction}
//                   onClick={() => setSelected(t)}
//                   style={{
//                     display: "grid",
//                     gridTemplateColumns: "1fr 1.4fr 1.2fr 0.8fr 1fr 1fr 0.5fr",
//                     padding: "14px 20px",
//                     gap: "8px",
//                     alignItems: "center",
//                     background: idx % 2 === 0 ? "#fff" : "#fafbff",
//                     borderBottom: "1px solid #f1f5f9",
//                     cursor: "pointer",
//                     transition: "background .15s",
//                   }}
//                   onMouseEnter={e => e.currentTarget.style.background = "#eef2ff"}
//                   onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fafbff"}
//                 >
//                   {/* Référence */}
//                   <div>
//                     <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#6366f1", fontFamily: "monospace" }}>
//                       {t.campay_reference?.slice(0, 14)}…
//                     </p>
//                     <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>
//                       ID #{t.id_transaction}
//                     </p>
//                   </div>

//                   {/* Admin */}
//                   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
//                     <div style={{
//                       width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
//                       background: "linear-gradient(135deg, #6366f1, #4f46e5)",
//                       display: "flex", alignItems: "center", justifyContent: "center",
//                       fontSize: "10px", fontWeight: 800, color: "#fff",
//                     }}>
//                       {(t.admin_prenom?.[0] || "A").toUpperCase()}
//                     </div>
//                     <div style={{ minWidth: 0 }}>
//                       <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                         {`${t.admin_prenom || ""} ${t.admin_nom || ""}`.trim() || "—"}
//                       </p>
//                       <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                         {t.admin_email || ""}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Élection */}
//                   <p style={{ margin: 0, fontSize: "12px", color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
//                     {electionTitre}
//                   </p>

//                   {/* Montant */}
//                   <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#1e3a5f" }}>
//                     {formatMontant(t.montant)}
//                   </p>

//                   {/* Statut */}
//                   <div><StatutBadge statut={t.statut} /></div>

//                   {/* Date */}
//                   <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
//                     {formatDate(t.date_creation)}
//                   </p>

//                   {/* Détail */}
//                   <button
//                     onClick={e => { e.stopPropagation(); setSelected(t); }}
//                     style={{
//                       padding: "5px 10px", borderRadius: "8px",
//                       border: "1px solid #e0e7ff", background: "#eef2ff",
//                       color: "#6366f1", fontSize: "11px", fontWeight: 600,
//                       cursor: "pointer", fontFamily: "inherit",
//                     }}
//                   >
//                     Voir
//                   </button>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </main>

//       {/* Drawer détail */}
//       <DetailDrawer transaction={selected} onClose={() => setSelected(null)} />

//       <style>{`
//         @keyframes spin { to { transform: rotate(360deg); } }
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }
//       `}</style>
//     </div>
//   );
// }
