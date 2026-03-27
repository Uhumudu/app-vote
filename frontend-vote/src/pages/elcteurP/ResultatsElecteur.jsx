// src/pages/elcteurP/ResultatsElecteur.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft, FiAward, FiUsers, FiBarChart2,
  FiCheckCircle, FiRepeat, FiUser, FiUserCheck, FiList
} from "react-icons/fi";
import api from "../../services/api";

// ─── URL de base du backend ───────────────────────────────────────────────────
const BASE_URL = "http://localhost:5000";

// ─── Construit l'URL complète de la photo ────────────────────────────────────
const getPhotoUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith("http")) return photo;             // déjà une URL complète
  if (photo.startsWith("/")) return `${BASE_URL}${photo}`; // chemin relatif /uploads/...
  return `${BASE_URL}/uploads/${photo}`;                  // nom de fichier seul
};

// ─── Icône + libellé selon le type de scrutin ───────────────────────────────
function ScrutinBadge({ type }) {
  const map = {
    LISTE:       { icon: <FiList size={10} />,      label: "Scrutin de liste",    cls: "bg-violet-100 text-violet-600" },
    UNINOMINAL:  { icon: <FiUser size={10} />,      label: "Scrutin uninominal",  cls: "bg-sky-100 text-sky-600" },
    BINOMINAL:   { icon: <FiUserCheck size={10} />, label: "Scrutin binominal",   cls: "bg-teal-100 text-teal-600" },
  };
  const s = map[type] || { icon: null, label: type, cls: "bg-gray-100 text-gray-500" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

// ─── Barre de progression ─────────────────────────────────────────────────────
function ProgressBar({ pct, winner, color }) {
  const barColor = winner ? "bg-amber-400" : color || "bg-indigo-400";
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

// ─── Rang (podium) ────────────────────────────────────────────────────────────
const PODIUM = [
  "bg-amber-100 text-amber-700 border-amber-200",
  "bg-gray-100  text-gray-500  border-gray-200",
  "bg-orange-100 text-orange-600 border-orange-200",
];
function RankBadge({ index }) {
  const cls = PODIUM[index] ?? "bg-indigo-50 text-indigo-400 border-indigo-100";
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${cls}`}>
      {index + 1}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION : UNINOMINAL
// ════════════════════════════════════════════════════════════════════════════
function SectionUninominal({ candidats, totalVotes }) {
  if (!candidats?.length) return <EmptyResults />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
      <SectionHeader title="Résultats par candidat" subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""}`} />
      <ul className="divide-y divide-gray-50">
        {candidats.map((c, i) => {
          const pct      = parseFloat(c.pourcentage) || 0;
          const isWin    = i === 0;
          const photoUrl = getPhotoUrl(c.photo); // ✅ URL complète
          return (
            <li key={c.id_candidat} className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWin ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}>
              <RankBadge index={i} />

              {/* ✅ Avatar / photo avec URL corrigée */}
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={c.nom}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-indigo-100"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <FiUser className="text-indigo-400" size={16} />
                </div>
              )}

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-gray-800 truncate">{c.nom}</p>
                  {isWin && <WinnerTag />}
                </div>
                {(c.parti || c.age) && (
                  <p className="text-xs text-gray-400 mb-2">
                    {c.parti}{c.parti && c.age ? " · " : ""}{c.age ? `${c.age} ans` : ""}
                  </p>
                )}
                <ProgressBar pct={pct} winner={isWin} />
              </div>

              <ScoreBox pct={pct} votes={c.nb_votes} winner={isWin} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION : BINOMINAL
// ════════════════════════════════════════════════════════════════════════════
function SectionBinominal({ candidats, totalVotes }) {
  if (!candidats?.length) return <EmptyResults />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
      <SectionHeader
        title="Résultats par candidat (binominal)"
        subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""} — chaque vote compte pour les 2 membres du binôme`}
      />

      {/* Info-bulle pédagogique */}
      <div className="mx-6 mt-4 mb-2 flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
        <FiUserCheck className="text-teal-500 flex-shrink-0 mt-0.5" size={14} />
        <p className="text-xs text-teal-700 leading-relaxed">
          Le scrutin binominal désigne <strong>deux candidats</strong> par bulletin.
          Les résultats ci-dessous reflètent le score obtenu par chaque candidat.
        </p>
      </div>

      <ul className="divide-y divide-gray-50 mt-2">
        {candidats.map((c, i) => {
          const pct      = parseFloat(c.pourcentage) || 0;
          const isWin    = i === 0;
          const isEven   = i % 2 === 0;
          const photoUrl = getPhotoUrl(c.photo); // ✅ URL complète

          return (
            <li
              key={c.id_candidat}
              className={`px-6 py-5 flex items-center gap-4 transition-colors ${
                isWin ? "bg-amber-50/40" : isEven ? "bg-teal-50/20 hover:bg-teal-50/40" : "hover:bg-gray-50/60"
              }`}
            >
              <RankBadge index={i} />

              {/* ✅ Avatar avec URL corrigée */}
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={c.nom}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-teal-100"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <FiUserCheck className="text-teal-400" size={16} />
                </div>
              )}

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-gray-800 truncate">{c.nom}</p>
                  {isWin && <WinnerTag />}
                  <span className="text-[10px] font-semibold bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200">
                    Binôme #{Math.floor(i / 2) + 1}
                  </span>
                </div>
                {(c.parti || c.age) && (
                  <p className="text-xs text-gray-400 mb-2">
                    {c.parti}{c.parti && c.age ? " · " : ""}{c.age ? `${c.age} ans` : ""}
                  </p>
                )}
                <ProgressBar pct={pct} winner={isWin} color="bg-teal-400" />
              </div>

              <ScoreBox pct={pct} votes={c.nb_votes} winner={isWin} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SECTION : LISTE (classement final + historique des tours)
// ════════════════════════════════════════════════════════════════════════════
function SectionListe({ listes, dataTours, totalVotes }) {
  const nbTours = dataTours?.tours?.length || 1;

  return (
    <>
      {/* ── Historique des tours ─────────────────────────────────────────── */}
      {dataTours?.tours?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiRepeat className="text-indigo-400" size={14} />
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Historique des tours</h2>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
              {nbTours} tour{nbTours > 1 ? "s" : ""}
            </span>
          </div>

          {dataTours.tours.map((tour, idx) => (
            <div
              key={tour.numero_tour}
              className={`px-6 py-5 ${idx < dataTours.tours.length - 1 ? "border-b border-gray-50" : ""} ${
                tour.statut === "GAGNANT_TROUVE" ? "bg-amber-50/40" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                  tour.statut === "GAGNANT_TROUVE" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
                }`}>
                  {tour.numero_tour}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">Tour {tour.numero_tour}</p>
                    {tour.statut === "GAGNANT_TROUVE" && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                        🏆 Décisif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""} exprimé{tour.total_votes > 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="space-y-2">
                {tour.votes.map((v, i) => {
                  const isW  = tour.statut === "GAGNANT_TROUVE" && i === 0;
                  const isEl = v.pourcentage < 5;
                  const isF  = v.pourcentage >= 5 && v.pourcentage <= 10;
                  return (
                    <div key={v.liste_id} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 w-28 truncate flex-shrink-0">{v.nom_liste}</span>
                      <ProgressBar pct={v.pourcentage} winner={isW} color={isEl ? "bg-red-300" : isF ? "bg-orange-300" : "bg-indigo-400"} />
                      <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
                        isW ? "text-amber-600" : isEl ? "text-red-500" : "text-gray-600"
                      }`}>
                        {v.pourcentage}%
                      </span>
                      {isW  && <span className="text-xs text-amber-600 font-semibold flex-shrink-0">🏆</span>}
                      {isEl && !isW && <span className="text-xs text-red-400 flex-shrink-0">Éliminée</span>}
                      {isF  && !isW && <span className="text-xs text-orange-400 flex-shrink-0">Fusion</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Répartition des sièges */}
          {dataTours.sieges?.length > 0 && (
            <div className="px-6 py-5 bg-amber-50/60 border-t border-amber-100">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FiAward size={12} /> Répartition des sièges
              </p>
              <div className="flex flex-wrap gap-3">
                {dataTours.sieges.map((s, i) => (
                  <div key={s.liste_id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
                    i === 0 ? "bg-amber-100 border-amber-200" : "bg-white border-gray-200"
                  }`}>
                    {i === 0 && <span>🏆</span>}
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
                      <p className="text-xs text-gray-400">{i === 0 ? "Bonus + proportion" : "Proportion"}</p>
                    </div>
                    <div className="ml-2 text-center">
                      <p className={`text-xl font-black ${i === 0 ? "text-amber-600" : "text-indigo-600"}`}>{s.nb_sieges}</p>
                      <p className="text-xs text-gray-400">siège{s.nb_sieges > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Classement final par liste ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
        <SectionHeader title="Résultats finaux par liste" subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""}`} />

        {!listes?.length ? (
          <EmptyResults />
        ) : (
          <ul className="divide-y divide-gray-50">
            {listes.map((item, i) => {
              const pct       = parseFloat(item.pourcentage) || 0;
              const isWin     = i === 0;
              const siegeItem = dataTours?.sieges?.find(s => s.liste_id === item.id_liste);
              return (
                <li
                  key={item.id_liste}
                  className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWin ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}
                >
                  <RankBadge index={i} />

                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <FiList className="text-violet-400" size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-gray-800 truncate">{item.nom_liste}</p>
                      {isWin && <WinnerTag />}
                      {siegeItem && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          isWin ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                        }`}>
                          <FiAward className="inline mr-1" size={9} />{siegeItem.nb_sieges} siège{siegeItem.nb_sieges > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {item.candidats && (
                      <p className="text-xs text-gray-400 mb-2 truncate">{item.candidats}</p>
                    )}
                    <ProgressBar pct={pct} winner={isWin} color="bg-violet-400" />
                  </div>

                  <ScoreBox pct={pct} votes={item.nb_votes} winner={isWin} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

// ─── Petits composants réutilisables ─────────────────────────────────────────
function WinnerTag() {
  return (
    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
      🏆 Vainqueur
    </span>
  );
}

function ScoreBox({ pct, votes, winner }) {
  return (
    <div className="text-right flex-shrink-0">
      <p className="text-xl font-black" style={{ color: winner ? "#d97706" : "#4338ca" }}>
        {pct}%
      </p>
      <p className="text-xs text-gray-400">{votes} vote{votes > 1 ? "s" : ""}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
      <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{title}</h2>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <p className="text-gray-700 font-bold">Aucun résultat disponible</p>
      <p className="text-gray-400 text-sm mt-1">Les données ne sont pas encore disponibles.</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function ResultatsElecteur() {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [data,      setData]      = useState(null);
  const [dataTours, setDataTours] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }

    const fetchAll = async () => {
      try {
        const res = await api.get(`/elections/${electionId}/resultats`);
        setData(res.data);

        if (res.data?.election?.type === "LISTE" || res.data?.election?.type_scrutin === "LISTE") {
          try {
            const tourRes = await api.get(`/elections/${electionId}/resultats-tours`);
            setDataTours(tourRes.data);
          } catch { /* non bloquant */ }
        }
      } catch {
        setError("Impossible de charger les résultats.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [electionId]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-500 font-medium text-sm">Chargement des résultats…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100 max-w-sm">
        <p className="text-red-500 font-bold mb-4">{error}</p>
        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  const {
    election,
    totalVotes,
    totalElecteurs,
    tauxParticipation,
    candidats,
    listes,
  } = data;

  const scrutinType  = election?.type || election?.type_scrutin || "";
  const isListe      = scrutinType === "LISTE";
  const isBinominal  = scrutinType === "BINOMINAL";
  const isUninominal = scrutinType === "UNINOMINAL" || (!isListe && !isBinominal);
  const nbTours      = dataTours?.tours?.length || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
        >
          <FiArrowLeft size={15} /> Retour
        </button>
        <div className="w-px h-5 bg-indigo-200" />
        <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
        <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
          Résultats
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* ── TITRE ──────────────────────────────────────────────────────── */}
        <div className="bg-indigo-700 rounded-2xl px-6 py-5 mb-8 flex items-center justify-between gap-4 flex-wrap shadow-sm">
          <div>
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Élection</p>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">{election.titre}</h1>
            <p className="text-indigo-300 text-sm mt-1">
              {new Date(election.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
              {" → "}
              {new Date(election.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {scrutinType && <ScrutinBadge type={scrutinType} />}
            {isListe && nbTours > 1 && (
              <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <FiRepeat size={10} /> {nbTours} tours
              </span>
            )}
          </div>
        </div>

        {/* ── KPI ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <FiUsers />,     value: totalElecteurs,          label: "Inscrits",       color: "#4338ca", bg: "bg-indigo-50",  border: "border-indigo-100" },
            { icon: <FiBarChart2 />, value: totalVotes,              label: "Votes exprimés", color: "#059669", bg: "bg-emerald-50", border: "border-emerald-100" },
            { icon: <FiAward />,     value: `${tauxParticipation}%`, label: "Participation",  color: "#d97706", bg: "bg-amber-50",   border: "border-amber-100" },
          ].map((kpi, i) => (
            <div key={i} className={`${kpi.bg} rounded-2xl border ${kpi.border} p-5 text-center`}>
              <div className="flex justify-center mb-2" style={{ color: kpi.color }}>{kpi.icon}</div>
              <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── RÉSULTATS ──────────────────────────────────────────────────── */}
        {isListe && <SectionListe listes={listes} dataTours={dataTours} totalVotes={totalVotes} />}
        {isBinominal && <SectionBinominal candidats={candidats} totalVotes={totalVotes} />}
        {isUninominal && <SectionUninominal candidats={candidats} totalVotes={totalVotes} />}

        {/* ── BOUTON RETOUR ──────────────────────────────────────────────── */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/DashboardElecteur")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all font-semibold text-sm shadow-sm"
          >
            <FiArrowLeft size={14} /> Retour au tableau de bord
          </button>
        </div>

      </main>
    </div>
  );
}








































// // src/pages/elcteurP/ResultatsElecteur.jsx
// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   FiArrowLeft, FiAward, FiUsers, FiBarChart2,
//   FiCheckCircle, FiRepeat, FiUser, FiUserCheck, FiList
// } from "react-icons/fi";
// import api from "../../services/api";

// // ─── Icône + libellé selon le type de scrutin ───────────────────────────────
// function ScrutinBadge({ type }) {
//   const map = {
//     LISTE:       { icon: <FiList size={10} />,      label: "Scrutin de liste",    cls: "bg-violet-100 text-violet-600" },
//     UNINOMINAL:  { icon: <FiUser size={10} />,      label: "Scrutin uninominal",  cls: "bg-sky-100 text-sky-600" },
//     BINOMINAL:   { icon: <FiUserCheck size={10} />, label: "Scrutin binominal",   cls: "bg-teal-100 text-teal-600" },
//   };
//   const s = map[type] || { icon: null, label: type, cls: "bg-gray-100 text-gray-500" };
//   return (
//     <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>
//       {s.icon}{s.label}
//     </span>
//   );
// }

// // ─── Barre de progression ─────────────────────────────────────────────────────
// function ProgressBar({ pct, winner, color }) {
//   const barColor = winner ? "bg-amber-400" : color || "bg-indigo-400";
//   return (
//     <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
//       <div
//         className={`h-full rounded-full transition-all duration-700 ${barColor}`}
//         style={{ width: `${Math.min(pct, 100)}%` }}
//       />
//     </div>
//   );
// }

// // ─── Rang (podium) ────────────────────────────────────────────────────────────
// const PODIUM = [
//   "bg-amber-100 text-amber-700 border-amber-200",
//   "bg-gray-100  text-gray-500  border-gray-200",
//   "bg-orange-100 text-orange-600 border-orange-200",
// ];
// function RankBadge({ index }) {
//   const cls = PODIUM[index] ?? "bg-indigo-50 text-indigo-400 border-indigo-100";
//   return (
//     <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${cls}`}>
//       {index + 1}
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SECTION : UNINOMINAL
// // ════════════════════════════════════════════════════════════════════════════
// function SectionUninominal({ candidats, totalVotes }) {
//   if (!candidats?.length) return <EmptyResults />;

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//       <SectionHeader title="Résultats par candidat" subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""}`} />
//       <ul className="divide-y divide-gray-50">
//         {candidats.map((c, i) => {
//           const pct   = parseFloat(c.pourcentage) || 0;
//           const isWin = i === 0;
//           return (
//             <li key={c.id_candidat} className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWin ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}>
//               <RankBadge index={i} />

//               {/* Avatar / photo */}
//               {c.photo ? (
//                 <img src={c.photo} alt={c.nom} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-indigo-100" />
//               ) : (
//                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
//                   <FiUser className="text-indigo-400" size={16} />
//                 </div>
//               )}

//               {/* Infos */}
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 mb-1 flex-wrap">
//                   <p className="font-bold text-gray-800 truncate">{c.nom}</p>
//                   {isWin && <WinnerTag />}
//                 </div>
//                 {(c.parti || c.age) && (
//                   <p className="text-xs text-gray-400 mb-2">
//                     {c.parti}{c.parti && c.age ? " · " : ""}{c.age ? `${c.age} ans` : ""}
//                   </p>
//                 )}
//                 <ProgressBar pct={pct} winner={isWin} />
//               </div>

//               {/* Score */}
//               <ScoreBox pct={pct} votes={c.nb_votes} winner={isWin} />
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SECTION : BINOMINAL
// // ════════════════════════════════════════════════════════════════════════════
// function SectionBinominal({ candidats, totalVotes }) {
//   if (!candidats?.length) return <EmptyResults />;

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//       <SectionHeader
//         title="Résultats par candidat (binominal)"
//         subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""} — chaque vote compte pour les 2 membres du binôme`}
//       />

//       {/* Info-bulle pédagogique */}
//       <div className="mx-6 mt-4 mb-2 flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
//         <FiUserCheck className="text-teal-500 flex-shrink-0 mt-0.5" size={14} />
//         <p className="text-xs text-teal-700 leading-relaxed">
//           Le scrutin binominal désigne <strong>deux candidats</strong> par bulletin.
//           Les résultats ci-dessous reflètent le score obtenu par chaque candidat.
//         </p>
//       </div>

//       <ul className="divide-y divide-gray-50 mt-2">
//         {candidats.map((c, i) => {
//           const pct    = parseFloat(c.pourcentage) || 0;
//           const isWin  = i === 0;
//           const isEven = i % 2 === 0;

//           return (
//             <li
//               key={c.id_candidat}
//               className={`px-6 py-5 flex items-center gap-4 transition-colors ${
//                 isWin ? "bg-amber-50/40" : isEven ? "bg-teal-50/20 hover:bg-teal-50/40" : "hover:bg-gray-50/60"
//               }`}
//             >
//               <RankBadge index={i} />

//               {/* Avatar */}
//               {c.photo ? (
//                 <img src={c.photo} alt={c.nom} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-teal-100" />
//               ) : (
//                 <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
//                   <FiUserCheck className="text-teal-400" size={16} />
//                 </div>
//               )}

//               {/* Infos */}
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 mb-1 flex-wrap">
//                   <p className="font-bold text-gray-800 truncate">{c.nom}</p>
//                   {isWin && <WinnerTag />}
//                   <span className="text-[10px] font-semibold bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200">
//                     Binôme #{Math.floor(i / 2) + 1}
//                   </span>
//                 </div>
//                 {(c.parti || c.age) && (
//                   <p className="text-xs text-gray-400 mb-2">
//                     {c.parti}{c.parti && c.age ? " · " : ""}{c.age ? `${c.age} ans` : ""}
//                   </p>
//                 )}
//                 <ProgressBar pct={pct} winner={isWin} color="bg-teal-400" />
//               </div>

//               <ScoreBox pct={pct} votes={c.nb_votes} winner={isWin} />
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SECTION : LISTE (classement final + historique des tours)
// // ════════════════════════════════════════════════════════════════════════════
// function SectionListe({ listes, dataTours, totalVotes }) {
//   const nbTours = dataTours?.tours?.length || 1;

//   return (
//     <>
//       {/* ── Historique des tours ─────────────────────────────────────────── */}
//       {dataTours?.tours?.length > 0 && (
//         <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
//           <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <FiRepeat className="text-indigo-400" size={14} />
//               <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Historique des tours</h2>
//             </div>
//             <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
//               {nbTours} tour{nbTours > 1 ? "s" : ""}
//             </span>
//           </div>

//           {dataTours.tours.map((tour, idx) => (
//             <div
//               key={tour.numero_tour}
//               className={`px-6 py-5 ${idx < dataTours.tours.length - 1 ? "border-b border-gray-50" : ""} ${
//                 tour.statut === "GAGNANT_TROUVE" ? "bg-amber-50/40" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3 mb-3">
//                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
//                   tour.statut === "GAGNANT_TROUVE" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
//                 }`}>
//                   {tour.numero_tour}
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm font-bold text-gray-800">Tour {tour.numero_tour}</p>
//                     {tour.statut === "GAGNANT_TROUVE" && (
//                       <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
//                         🏆 Décisif
//                       </span>
//                     )}
//                   </div>
//                   <p className="text-xs text-gray-400">{tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""} exprimé{tour.total_votes > 1 ? "s" : ""}</p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 {tour.votes.map((v, i) => {
//                   const isW  = tour.statut === "GAGNANT_TROUVE" && i === 0;
//                   const isEl = v.pourcentage < 5;
//                   const isF  = v.pourcentage >= 5 && v.pourcentage <= 10;
//                   return (
//                     <div key={v.liste_id} className="flex items-center gap-3">
//                       <span className="text-xs font-medium text-gray-600 w-28 truncate flex-shrink-0">{v.nom_liste}</span>
//                       <ProgressBar pct={v.pourcentage} winner={isW} color={isEl ? "bg-red-300" : isF ? "bg-orange-300" : "bg-indigo-400"} />
//                       <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
//                         isW ? "text-amber-600" : isEl ? "text-red-500" : "text-gray-600"
//                       }`}>
//                         {v.pourcentage}%
//                       </span>
//                       {isW  && <span className="text-xs text-amber-600 font-semibold flex-shrink-0">🏆</span>}
//                       {isEl && !isW && <span className="text-xs text-red-400 flex-shrink-0">Éliminée</span>}
//                       {isF  && !isW && <span className="text-xs text-orange-400 flex-shrink-0">Fusion</span>}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}

//           {/* Répartition des sièges */}
//           {dataTours.sieges?.length > 0 && (
//             <div className="px-6 py-5 bg-amber-50/60 border-t border-amber-100">
//               <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
//                 <FiAward size={12} /> Répartition des sièges
//               </p>
//               <div className="flex flex-wrap gap-3">
//                 {dataTours.sieges.map((s, i) => (
//                   <div key={s.liste_id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
//                     i === 0 ? "bg-amber-100 border-amber-200" : "bg-white border-gray-200"
//                   }`}>
//                     {i === 0 && <span>🏆</span>}
//                     <div>
//                       <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
//                       <p className="text-xs text-gray-400">{i === 0 ? "Bonus + proportion" : "Proportion"}</p>
//                     </div>
//                     <div className="ml-2 text-center">
//                       <p className={`text-xl font-black ${i === 0 ? "text-amber-600" : "text-indigo-600"}`}>{s.nb_sieges}</p>
//                       <p className="text-xs text-gray-400">siège{s.nb_sieges > 1 ? "s" : ""}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── Classement final par liste ────────────────────────────────────── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//         <SectionHeader title="Résultats finaux par liste" subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""}`} />

//         {!listes?.length ? (
//           <EmptyResults />
//         ) : (
//           <ul className="divide-y divide-gray-50">
//             {listes.map((item, i) => {
//               const pct       = parseFloat(item.pourcentage) || 0;
//               const isWin     = i === 0;
//               const siegeItem = dataTours?.sieges?.find(s => s.liste_id === item.id_liste);
//               return (
//                 <li
//                   key={item.id_liste}
//                   className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWin ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}
//                 >
//                   <RankBadge index={i} />

//                   {/* Icône liste */}
//                   <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
//                     <FiList className="text-violet-400" size={16} />
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2 mb-1 flex-wrap">
//                       <p className="font-bold text-gray-800 truncate">{item.nom_liste}</p>
//                       {isWin && <WinnerTag />}
//                       {siegeItem && (
//                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
//                           isWin ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"
//                         }`}>
//                           <FiAward className="inline mr-1" size={9} />{siegeItem.nb_sieges} siège{siegeItem.nb_sieges > 1 ? "s" : ""}
//                         </span>
//                       )}
//                     </div>
//                     {item.candidats && (
//                       <p className="text-xs text-gray-400 mb-2 truncate">{item.candidats}</p>
//                     )}
//                     <ProgressBar pct={pct} winner={isWin} color="bg-violet-400" />
//                   </div>

//                   <ScoreBox pct={pct} votes={item.nb_votes} winner={isWin} />
//                 </li>
//               );
//             })}
//           </ul>
//         )}
//       </div>
//     </>
//   );
// }

// // ─── Petits composants réutilisables ─────────────────────────────────────────
// function WinnerTag() {
//   return (
//     <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
//       🏆 Vainqueur
//     </span>
//   );
// }

// function ScoreBox({ pct, votes, winner }) {
//   return (
//     <div className="text-right flex-shrink-0">
//       <p className="text-xl font-black" style={{ color: winner ? "#d97706" : "#4338ca" }}>
//         {pct}%
//       </p>
//       <p className="text-xs text-gray-400">{votes} vote{votes > 1 ? "s" : ""}</p>
//     </div>
//   );
// }

// function SectionHeader({ title, subtitle }) {
//   return (
//     <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
//       <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{title}</h2>
//       {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
//     </div>
//   );
// }

// function EmptyResults() {
//   return (
//     <div className="flex flex-col items-center justify-center py-16 text-center px-6">
//       <p className="text-gray-700 font-bold">Aucun résultat disponible</p>
//       <p className="text-gray-400 text-sm mt-1">Les données ne sont pas encore disponibles.</p>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // COMPOSANT PRINCIPAL
// // ════════════════════════════════════════════════════════════════════════════
// export default function ResultatsElecteur() {
//   const { electionId } = useParams();
//   const navigate       = useNavigate();

//   const [data,      setData]      = useState(null);
//   const [dataTours, setDataTours] = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { navigate("/Login"); return; }

//     const fetchAll = async () => {
//       try {
//         const res = await api.get(`/elections/${electionId}/resultats`);
//         setData(res.data);

//         // On tente de récupérer les tours pour le scrutin LISTE
//         if (res.data?.election?.type === "LISTE" || res.data?.election?.type_scrutin === "LISTE") {
//           try {
//             const tourRes = await api.get(`/elections/${electionId}/resultats-tours`);
//             setDataTours(tourRes.data);
//           } catch { /* non bloquant */ }
//         }
//       } catch {
//         setError("Impossible de charger les résultats.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [electionId]);

//   // ─── Loading ──────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
//         <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
//         <p className="text-indigo-500 font-medium text-sm">Chargement des résultats…</p>
//       </div>
//     </div>
//   );

//   // ─── Error ────────────────────────────────────────────────────────────────
//   if (error) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100 max-w-sm">
//         <p className="text-red-500 font-bold mb-4">{error}</p>
//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
//         >
//           Retour au tableau de bord
//         </button>
//       </div>
//     </div>
//   );

//   const {
//     election,
//     totalVotes,
//     totalElecteurs,
//     tauxParticipation,
//     candidats,
//     listes,
//   } = data;

//   // Normalise le type (l'API peut renvoyer `type` ou `type_scrutin`)
//   const scrutinType = election?.type || election?.type_scrutin || "";
//   const isListe      = scrutinType === "LISTE";
//   const isBinominal  = scrutinType === "BINOMINAL";
//   const isUninominal = scrutinType === "UNINOMINAL" || (!isListe && !isBinominal);

//   const nbTours = dataTours?.tours?.length || 1;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
//         >
//           <FiArrowLeft size={15} /> Retour
//         </button>
//         <div className="w-px h-5 bg-indigo-200" />
//         <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
//         <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
//           Résultats
//         </span>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ── TITRE (bandeau violet foncé) ────────────────────────────────── */}
//         <div className="bg-indigo-700 rounded-2xl px-6 py-5 mb-8 flex items-center justify-between gap-4 flex-wrap shadow-sm">
//           <div>
//             <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Élection</p>
//             <h1 className="text-2xl font-black text-white tracking-tight leading-tight">{election.titre}</h1>
//             <p className="text-indigo-300 text-sm mt-1">
//               {new Date(election.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
//               {" → "}
//               {new Date(election.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
//             </p>
//           </div>
//           <div className="flex items-center gap-2 flex-wrap">
//             {scrutinType && <ScrutinBadge type={scrutinType} />}
//             {isListe && nbTours > 1 && (
//               <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
//                 <FiRepeat size={10} /> {nbTours} tours
//               </span>
//             )}
//           </div>
//         </div>

//         {/* ── KPI ────────────────────────────────────────────────────────── */}
//         <div className="grid grid-cols-3 gap-4 mb-8">
//           {[
//             { icon: <FiUsers />,    value: totalElecteurs,          label: "Inscrits",        color: "#4338ca", bg: "bg-indigo-50",  border: "border-indigo-100" },
//             { icon: <FiBarChart2 />,value: totalVotes,              label: "Votes exprimés",  color: "#059669", bg: "bg-emerald-50", border: "border-emerald-100" },
//             { icon: <FiAward />,    value: `${tauxParticipation}%`, label: "Participation",   color: "#d97706", bg: "bg-amber-50",   border: "border-amber-100" },
//           ].map((kpi, i) => (
//             <div key={i} className={`${kpi.bg} rounded-2xl border ${kpi.border} p-5 text-center`}>
//               <div className="flex justify-center mb-2" style={{ color: kpi.color }}>{kpi.icon}</div>
//               <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
//               <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{kpi.label}</p>
//             </div>
//           ))}
//         </div>

//         {/* ── RÉSULTATS SELON LE TYPE DE SCRUTIN ─────────────────────────── */}
//         {isListe && (
//           <SectionListe
//             listes={listes}
//             dataTours={dataTours}
//             totalVotes={totalVotes}
//           />
//         )}

//         {isBinominal && (
//           <SectionBinominal
//             candidats={candidats}
//             totalVotes={totalVotes}
//           />
//         )}

//         {isUninominal && (
//           <SectionUninominal
//             candidats={candidats}
//             totalVotes={totalVotes}
//           />
//         )}

//         {/* ── BOUTON RETOUR ───────────────────────────────────────────────── */}
//         <div className="mt-8 text-center">
//           <button
//             onClick={() => navigate("/DashboardElecteur")}
//             className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all font-semibold text-sm shadow-sm"
//           >
//             <FiArrowLeft size={14} /> Retour au tableau de bord
//           </button>
//         </div>

//       </main>
//     </div>
//   );
// }





































// // src/pages/elcteurP/ResultatsElecteur.jsx
// import { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   FiArrowLeft, FiAward, FiUsers, FiBarChart2,
//   FiCheckCircle, FiRepeat, FiUser, FiUserCheck, FiList
// } from "react-icons/fi";
// import api from "../../services/api";

// // ─── Icône + libellé selon le type de scrutin ───────────────────────────────
// function ScrutinBadge({ type }) {
//   const map = {
//     LISTE:       { icon: <FiList size={10} />,      label: "Scrutin de liste",    cls: "bg-violet-100 text-violet-600" },
//     UNINOMINAL:  { icon: <FiUser size={10} />,      label: "Scrutin uninominal",  cls: "bg-sky-100 text-sky-600" },
//     BINOMINAL:   { icon: <FiUserCheck size={10} />, label: "Scrutin binominal",   cls: "bg-teal-100 text-teal-600" },
//   };
//   const s = map[type] || { icon: null, label: type, cls: "bg-gray-100 text-gray-500" };
//   return (
//     <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.cls}`}>
//       {s.icon}{s.label}
//     </span>
//   );
// }

// // ─── Barre de progression ─────────────────────────────────────────────────────
// function ProgressBar({ pct, winner, color }) {
//   const barColor = winner ? "bg-amber-400" : color || "bg-indigo-400";
//   return (
//     <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
//       <div
//         className={`h-full rounded-full transition-all duration-700 ${barColor}`}
//         style={{ width: `${Math.min(pct, 100)}%` }}
//       />
//     </div>
//   );
// }

// // ─── Rang (podium) ────────────────────────────────────────────────────────────
// const PODIUM = [
//   "bg-amber-100 text-amber-700 border-amber-200",
//   "bg-gray-100  text-gray-500  border-gray-200",
//   "bg-orange-100 text-orange-600 border-orange-200",
// ];
// function RankBadge({ index }) {
//   const cls = PODIUM[index] ?? "bg-indigo-50 text-indigo-400 border-indigo-100";
//   return (
//     <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${cls}`}>
//       {index + 1}
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SECTION : UNINOMINAL
// // ════════════════════════════════════════════════════════════════════════════
// function SectionUninominal({ candidats, totalVotes }) {
//   if (!candidats?.length) return <EmptyResults />;

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//       <SectionHeader title="Résultats par candidat" subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""}`} />
//       <ul className="divide-y divide-gray-50">
//         {candidats.map((c, i) => {
//           const pct     = parseFloat(c.pourcentage) || 0;
//           const isWin   = i === 0;
//           return (
//             <li key={c.id_candidat} className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWin ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}>
//               <RankBadge index={i} />

//               {/* Avatar / photo */}
//               {c.photo ? (
//                 <img src={c.photo} alt={c.nom} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-indigo-100" />
//               ) : (
//                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
//                   <FiUser className="text-indigo-400" size={16} />
//                 </div>
//               )}

//               {/* Infos */}
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 mb-1 flex-wrap">
//                   <p className="font-bold text-gray-800 truncate">{c.nom}</p>
//                   {isWin && <WinnerTag />}
//                 </div>
//                 {(c.parti || c.age) && (
//                   <p className="text-xs text-gray-400 mb-2">
//                     {c.parti}{c.parti && c.age ? " · " : ""}{c.age ? `${c.age} ans` : ""}
//                   </p>
//                 )}
//                 <ProgressBar pct={pct} winner={isWin} />
//               </div>

//               {/* Score */}
//               <ScoreBox pct={pct} votes={c.nb_votes} winner={isWin} />
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SECTION : BINOMINAL
// // ════════════════════════════════════════════════════════════════════════════
// function SectionBinominal({ candidats, totalVotes }) {
//   if (!candidats?.length) return <EmptyResults />;

//   // Regrouper par binôme : candidat (id_candidat) + candidat2 (candidat2_id via nb_votes partagé)
//   // La API retourne les candidats individuels ; on les affiche par paires (index pair/impair)
//   // Si l'API retourne des binômes comme entités séparées, on les affiche directement.
//   // Ici on gère le cas où chaque ligne = 1 candidat individuel.
//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//       <SectionHeader
//         title="Résultats par candidat (binominal)"
//         subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""} — chaque vote compte pour les 2 membres du binôme`}
//       />

//       {/* Info-bulle pédagogique */}
//       <div className="mx-6 mt-4 mb-2 flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3">
//         <FiUserCheck className="text-teal-500 flex-shrink-0 mt-0.5" size={14} />
//         <p className="text-xs text-teal-700 leading-relaxed">
//           Le scrutin binominal désigne <strong>deux candidats</strong> par bulletin.
//           Les résultats ci-dessous reflètent le score obtenu par chaque candidat.
//         </p>
//       </div>

//       <ul className="divide-y divide-gray-50 mt-2">
//         {candidats.map((c, i) => {
//           const pct   = parseFloat(c.pourcentage) || 0;
//           const isWin = i === 0;
//           const isEven = i % 2 === 0;  // Pour colorer les binômes en alternance

//           return (
//             <li
//               key={c.id_candidat}
//               className={`px-6 py-5 flex items-center gap-4 transition-colors ${
//                 isWin ? "bg-amber-50/40" : isEven ? "bg-teal-50/20 hover:bg-teal-50/40" : "hover:bg-gray-50/60"
//               }`}
//             >
//               <RankBadge index={i} />

//               {/* Avatar */}
//               {c.photo ? (
//                 <img src={c.photo} alt={c.nom} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-teal-100" />
//               ) : (
//                 <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
//                   <FiUserCheck className="text-teal-400" size={16} />
//                 </div>
//               )}

//               {/* Infos */}
//               <div className="flex-1 min-w-0">
//                 <div className="flex items-center gap-2 mb-1 flex-wrap">
//                   <p className="font-bold text-gray-800 truncate">{c.nom}</p>
//                   {isWin && <WinnerTag />}
//                   {/* Badge binôme */}
//                   <span className="text-[10px] font-semibold bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full border border-teal-200">
//                     Binôme #{Math.floor(i / 2) + 1}
//                   </span>
//                 </div>
//                 {(c.parti || c.age) && (
//                   <p className="text-xs text-gray-400 mb-2">
//                     {c.parti}{c.parti && c.age ? " · " : ""}{c.age ? `${c.age} ans` : ""}
//                   </p>
//                 )}
//                 <ProgressBar pct={pct} winner={isWin} color="bg-teal-400" />
//               </div>

//               <ScoreBox pct={pct} votes={c.nb_votes} winner={isWin} />
//             </li>
//           );
//         })}
//       </ul>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // SECTION : LISTE (classement final + historique des tours)
// // ════════════════════════════════════════════════════════════════════════════
// function SectionListe({ listes, dataTours, totalVotes }) {
//   const nbTours = dataTours?.tours?.length || 1;

//   return (
//     <>
//       {/* ── Historique des tours ─────────────────────────────────────────── */}
//       {dataTours?.tours?.length > 0 && (
//         <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden mb-6">
//           <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <FiRepeat className="text-indigo-400" size={14} />
//               <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Historique des tours</h2>
//             </div>
//             <span className="text-xs bg-indigo-100 text-indigo-600 font-bold px-2.5 py-1 rounded-full">
//               {nbTours} tour{nbTours > 1 ? "s" : ""}
//             </span>
//           </div>

//           {dataTours.tours.map((tour, idx) => (
//             <div
//               key={tour.numero_tour}
//               className={`px-6 py-5 ${idx < dataTours.tours.length - 1 ? "border-b border-gray-50" : ""} ${
//                 tour.statut === "GAGNANT_TROUVE" ? "bg-amber-50/40" : ""
//               }`}
//             >
//               <div className="flex items-center gap-3 mb-3">
//                 <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
//                   tour.statut === "GAGNANT_TROUVE" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
//                 }`}>
//                   {tour.numero_tour}
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <p className="text-sm font-bold text-gray-800">Tour {tour.numero_tour}</p>
//                     {tour.statut === "GAGNANT_TROUVE" && (
//                       <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
//                         🏆 Décisif
//                       </span>
//                     )}
//                   </div>
//                   <p className="text-xs text-gray-400">{tour.total_votes} vote{tour.total_votes > 1 ? "s" : ""} exprimé{tour.total_votes > 1 ? "s" : ""}</p>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 {tour.votes.map((v, i) => {
//                   const isW  = tour.statut === "GAGNANT_TROUVE" && i === 0;
//                   const isEl = v.pourcentage < 5;
//                   const isF  = v.pourcentage >= 5 && v.pourcentage <= 10;
//                   return (
//                     <div key={v.liste_id} className="flex items-center gap-3">
//                       <span className="text-xs font-medium text-gray-600 w-28 truncate flex-shrink-0">{v.nom_liste}</span>
//                       <ProgressBar pct={v.pourcentage} winner={isW} color={isEl ? "bg-red-300" : isF ? "bg-orange-300" : "bg-indigo-400"} />
//                       <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${
//                         isW ? "text-amber-600" : isEl ? "text-red-500" : "text-gray-600"
//                       }`}>
//                         {v.pourcentage}%
//                       </span>
//                       {isW  && <span className="text-xs text-amber-600 font-semibold flex-shrink-0">🏆</span>}
//                       {isEl && !isW && <span className="text-xs text-red-400 flex-shrink-0">Éliminée</span>}
//                       {isF  && !isW && <span className="text-xs text-orange-400 flex-shrink-0">Fusion</span>}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}

//           {/* Répartition des sièges */}
//           {dataTours.sieges?.length > 0 && (
//             <div className="px-6 py-5 bg-amber-50/60 border-t border-amber-100">
//               <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-1.5">
//                 <FiAward size={12} /> Répartition des sièges
//               </p>
//               <div className="flex flex-wrap gap-3">
//                 {dataTours.sieges.map((s, i) => (
//                   <div key={s.liste_id} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
//                     i === 0 ? "bg-amber-100 border-amber-200" : "bg-white border-gray-200"
//                   }`}>
//                     {i === 0 && <span>🏆</span>}
//                     <div>
//                       <p className="text-sm font-bold text-gray-800">{s.nom_liste}</p>
//                       <p className="text-xs text-gray-400">{i === 0 ? "Bonus + proportion" : "Proportion"}</p>
//                     </div>
//                     <div className="ml-2 text-center">
//                       <p className={`text-xl font-black ${i === 0 ? "text-amber-600" : "text-indigo-600"}`}>{s.nb_sieges}</p>
//                       <p className="text-xs text-gray-400">siège{s.nb_sieges > 1 ? "s" : ""}</p>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* ── Classement final par liste ────────────────────────────────────── */}
//       <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
//         <SectionHeader title="Résultats finaux par liste" subtitle={`${totalVotes} vote${totalVotes > 1 ? "s" : ""} exprimé${totalVotes > 1 ? "s" : ""}`} />

//         {!listes?.length ? (
//           <EmptyResults />
//         ) : (
//           <ul className="divide-y divide-gray-50">
//             {listes.map((item, i) => {
//               const pct      = parseFloat(item.pourcentage) || 0;
//               const isWin    = i === 0;
//               const siegeItem = dataTours?.sieges?.find(s => s.liste_id === item.id_liste);
//               return (
//                 <li
//                   key={item.id_liste}
//                   className={`px-6 py-5 flex items-center gap-4 transition-colors ${isWin ? "bg-amber-50/40" : "hover:bg-gray-50/60"}`}
//                 >
//                   <RankBadge index={i} />

//                   {/* Icône liste */}
//                   <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
//                     <FiList className="text-violet-400" size={16} />
//                   </div>

//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2 mb-1 flex-wrap">
//                       <p className="font-bold text-gray-800 truncate">{item.nom_liste}</p>
//                       {isWin && <WinnerTag />}
//                       {siegeItem && (
//                         <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
//                           isWin ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"
//                         }`}>
//                           <FiAward className="inline mr-1" size={9} />{siegeItem.nb_sieges} siège{siegeItem.nb_sieges > 1 ? "s" : ""}
//                         </span>
//                       )}
//                     </div>
//                     {item.candidats && (
//                       <p className="text-xs text-gray-400 mb-2 truncate">{item.candidats}</p>
//                     )}
//                     <ProgressBar pct={pct} winner={isWin} color="bg-violet-400" />
//                   </div>

//                   <ScoreBox pct={pct} votes={item.nb_votes} winner={isWin} />
//                 </li>
//               );
//             })}
//           </ul>
//         )}
//       </div>
//     </>
//   );
// }

// // ─── Petits composants réutilisables ─────────────────────────────────────────
// function WinnerTag() {
//   return (
//     <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
//       🏆 Vainqueur
//     </span>
//   );
// }

// function ScoreBox({ pct, votes, winner }) {
//   return (
//     <div className="text-right flex-shrink-0">
//       <p className="text-xl font-black" style={{ color: winner ? "#d97706" : "#4338ca" }}>
//         {pct}%
//       </p>
//       <p className="text-xs text-gray-400">{votes} vote{votes > 1 ? "s" : ""}</p>
//     </div>
//   );
// }

// function SectionHeader({ title, subtitle }) {
//   return (
//     <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
//       <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{title}</h2>
//       {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
//     </div>
//   );
// }

// function EmptyResults() {
//   return (
//     <div className="flex flex-col items-center justify-center py-16 text-center px-6">
//       <p className="text-gray-700 font-bold">Aucun résultat disponible</p>
//       <p className="text-gray-400 text-sm mt-1">Les données ne sont pas encore disponibles.</p>
//     </div>
//   );
// }

// // ════════════════════════════════════════════════════════════════════════════
// // COMPOSANT PRINCIPAL
// // ════════════════════════════════════════════════════════════════════════════
// export default function ResultatsElecteur() {
//   const { electionId } = useParams();
//   const navigate       = useNavigate();

//   const [data,      setData]      = useState(null);
//   const [dataTours, setDataTours] = useState(null);
//   const [loading,   setLoading]   = useState(true);
//   const [error,     setError]     = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (!token) { navigate("/Login"); return; }

//     const fetchAll = async () => {
//       try {
//         const res = await api.get(`/elections/${electionId}/resultats`);
//         setData(res.data);

//         // On tente de récupérer les tours pour le scrutin LISTE
//         if (res.data?.election?.type === "LISTE" || res.data?.election?.type_scrutin === "LISTE") {
//           try {
//             const tourRes = await api.get(`/elections/${electionId}/resultats-tours`);
//             setDataTours(tourRes.data);
//           } catch { /* non bloquant */ }
//         }
//       } catch {
//         setError("Impossible de charger les résultats.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAll();
//   }, [electionId]);

//   // ─── Loading ──────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
//         <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
//         <p className="text-indigo-500 font-medium text-sm">Chargement des résultats…</p>
//       </div>
//     </div>
//   );

//   // ─── Error ────────────────────────────────────────────────────────────────
//   if (error) return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
//       <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-100 max-w-sm">
//         <p className="text-red-500 font-bold mb-4">{error}</p>
//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
//         >
//           Retour au tableau de bord
//         </button>
//       </div>
//     </div>
//   );

//   const {
//     election,
//     totalVotes,
//     totalElecteurs,
//     tauxParticipation,
//     candidats,
//     listes,
//   } = data;

//   // Normalise le type (l'API peut renvoyer `type` ou `type_scrutin`)
//   const scrutinType = election?.type || election?.type_scrutin || "";
//   const isListe      = scrutinType === "LISTE";
//   const isBinominal  = scrutinType === "BINOMINAL";
//   const isUninominal = scrutinType === "UNINOMINAL" || (!isListe && !isBinominal);

//   const nbTours = dataTours?.tours?.length || 1;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

//       {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
//       <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
//         <button
//           onClick={() => navigate("/DashboardElecteur")}
//           className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
//         >
//           <FiArrowLeft size={15} /> Retour
//         </button>
//         <div className="w-px h-5 bg-indigo-200" />
//         <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
//         <span className="text-[11px] bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
//           Résultats
//         </span>
//       </header>

//       <main className="max-w-3xl mx-auto px-6 py-10">

//         {/* ── TITRE ──────────────────────────────────────────────────────── */}
//         <div className="mb-8">
//           <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full mb-3">
//             <FiCheckCircle size={11} /> Élection terminée
//           </div>
//           <h1 className="text-3xl font-black text-indigo-900 tracking-tight leading-tight">{election.titre}</h1>
//           <div className="flex items-center gap-2 mt-2 flex-wrap">
//             <p className="text-indigo-400 text-sm">
//               {new Date(election.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
//               {" → "}
//               {new Date(election.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
//             </p>
//             {scrutinType && <ScrutinBadge type={scrutinType} />}
//             {isListe && nbTours > 1 && (
//               <span className="bg-orange-100 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
//                 <FiRepeat size={10} /> {nbTours} tours
//               </span>
//             )}
//           </div>
//         </div>

//         {/* ── KPI ────────────────────────────────────────────────────────── */}
//         <div className="grid grid-cols-3 gap-4 mb-8">
//           {[
//             { icon: <FiUsers />,    value: totalElecteurs,        label: "Inscrits",        color: "#4338ca", bg: "bg-indigo-50",  border: "border-indigo-100" },
//             { icon: <FiBarChart2 />,value: totalVotes,            label: "Votes exprimés",  color: "#059669", bg: "bg-emerald-50", border: "border-emerald-100" },
//             { icon: <FiAward />,    value: `${tauxParticipation}%`, label: "Participation", color: "#d97706", bg: "bg-amber-50",   border: "border-amber-100" },
//           ].map((kpi, i) => (
//             <div key={i} className={`${kpi.bg} rounded-2xl border ${kpi.border} p-5 text-center`}>
//               <div className="flex justify-center mb-2" style={{ color: kpi.color }}>{kpi.icon}</div>
//               <p className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
//               <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{kpi.label}</p>
//             </div>
//           ))}
//         </div>

//         {/* ── RÉSULTATS SELON LE TYPE DE SCRUTIN ─────────────────────────── */}
//         {isListe && (
//           <SectionListe
//             listes={listes}
//             dataTours={dataTours}
//             totalVotes={totalVotes}
//           />
//         )}

//         {isBinominal && (
//           <SectionBinominal
//             candidats={candidats}
//             totalVotes={totalVotes}
//           />
//         )}

//         {isUninominal && (
//           <SectionUninominal
//             candidats={candidats}
//             totalVotes={totalVotes}
//           />
//         )}

//         {/* ── BOUTON RETOUR ───────────────────────────────────────────────── */}
//         <div className="mt-8 text-center">
//           <button
//             onClick={() => navigate("/DashboardElecteur")}
//             className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-50 active:scale-95 transition-all font-semibold text-sm shadow-sm"
//           >
//             <FiArrowLeft size={14} /> Retour au tableau de bord
//           </button>
//         </div>

//       </main>
//     </div>
//   );
// }


