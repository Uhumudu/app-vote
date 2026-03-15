// src/pages/elcteurP/VotePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiCheckCircle, FiArrowLeft, FiAlertCircle, FiRepeat, FiUser } from "react-icons/fi";
import api from "../../services/api";
import CountdownTimer from "../../components/CountdownTimer";

export default function VotePage() {
  const { electionId } = useParams();
  const navigate       = useNavigate();

  const [election,   setElection]   = useState(null);
  const [candidats,  setCandidats]  = useState([]);
  const [listes,     setListes]     = useState([]);
  const [etatTour,   setEtatTour]   = useState(null);
  const [selected,   setSelected]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted,      setVoted]      = useState(false);
  const [error,      setError]      = useState("");

  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const initiales = `${user.prenom?.charAt(0) ?? ""}${user.nom?.charAt(0) ?? ""}`.toUpperCase();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/Login"); return; }
    fetchData();
  }, [electionId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Charger l'élection d'abord (séparément pour mieux identifier les erreurs)
      const elecRes = await api.get(`/electeur/elections/${electionId}`);
      const elec    = elecRes.data;

      // Normaliser les champs — le backend peut renvoyer date_debut ou startDate
      const elecNormalized = {
        ...elec,
        titre:      elec.titre      ?? elec.title      ?? "",
        type:       elec.type       ?? elec.type_scrutin ?? "",
        date_debut: elec.date_debut ?? elec.startDate  ?? null,
        date_fin:   elec.date_fin   ?? elec.endDate    ?? null,
        statut:     elec.statut     ?? elec.status     ?? "",
      };

      setElection(elecNormalized);
      console.log("✅ Élection chargée:", elecNormalized);

      // Charger les candidats
      const candidatsRes = await api.get(`/electeur/elections/${electionId}/candidats`);
      setCandidats(candidatsRes.data);
      console.log("✅ Candidats:", candidatsRes.data.length);

      // Charger les listes si scrutin LISTE
      if (elecNormalized.type === "LISTE") {
        const [listesRes, etatRes] = await Promise.all([
          api.get(`/electeur/elections/${electionId}/listes`),
          api.get(`/electeur/elections/${electionId}/etat-tour`),
        ]);
        setListes(listesRes.data);
        setEtatTour(etatRes.data);
      }

    } catch (err) {
      console.error("❌ Erreur fetchData:", err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.message || "Impossible de charger l'élection.");
    } finally {
      setLoading(false);
    }
  };

  const getMaxSelections = () => {
    if (!election) return 1;
    if (election.type === "BINOMINAL") return 2;
    return 1;
  };

  const handleSelect = (id) => {
    const max = getMaxSelections();
    if (max === 1) { setSelected([id]); return; }
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id));
    } else if (selected.length < max) {
      setSelected([...selected, id]);
    }
  };

  const handleVote = async () => {
    if (selected.length === 0) {
      setError(isListe ? "Veuillez sélectionner une liste." : "Veuillez sélectionner un candidat.");
      return;
    }
    if (election.type === "BINOMINAL" && selected.length < 2) {
      setError("Veuillez sélectionner exactement 2 candidats.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (isListe) {
        await api.post(`/elections/${electionId}/voter-liste`, { liste_id: selected[0] });
      } else {
        await api.post(`/elections/${electionId}/voter`, { candidat_ids: selected });
      }
      setVoted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors du vote.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur rounded-2xl p-10 flex flex-col items-center gap-4 shadow-lg">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-indigo-600 font-semibold text-sm">Chargement du bulletin…</p>
      </div>
    </div>
  );

  // ── CONFIRMATION APRÈS VOTE ───────────────────────────────────────────────
  if (voted) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCheckCircle className="text-5xl text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-1 tracking-tight">Vote enregistré !</h2>
        <p className="text-gray-400 text-sm mb-1">Pour l'élection :</p>
        <p className="text-indigo-700 font-bold text-base mb-5">{election?.titre}</p>

        {election?.type === "LISTE" && etatTour && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
              {etatTour.tour}
            </div>
            <span className="text-sm text-indigo-500 font-medium">Tour {etatTour.tour}</span>
          </div>
        )}

        <div className="bg-indigo-50 rounded-2xl p-4 mb-4">
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-3">Votre choix</p>
          {election?.type === "LISTE"
            ? listes.filter(l => selected.includes(l.id_liste)).map(l => (
                <div key={l.id_liste} className="flex items-center gap-3 justify-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">{l.nom.charAt(0)}</div>
                  <span className="font-bold text-indigo-900">{l.nom}</span>
                </div>
              ))
            : candidats.filter(c => selected.includes(c.id_candidat)).map(c => (
                <div key={c.id_candidat} className="flex items-center gap-3 justify-center mb-2">
                  {c.photo
                    ? <img src={c.photo} alt={c.nom} className="w-8 h-8 rounded-full object-cover" />
                    : <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-black text-sm">{c.nom.charAt(0)}</div>
                  }
                  <span className="font-bold text-indigo-900">{c.nom}</span>
                  {c.parti && <span className="text-xs text-gray-400">— {c.parti}</span>}
                </div>
              ))
          }
        </div>

        {election?.type === "LISTE" && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3">
            <p className="text-indigo-600 text-xs font-medium flex items-center gap-2 justify-center">
              <FiRepeat size={12} />
              Un nouveau tour peut s'ouvrir si aucune liste n'atteint la majorité absolue.
            </p>
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="text-amber-700 text-xs font-medium">🔒 Votre vote est anonyme et ne peut pas être modifié.</p>
        </div>

        <button
          onClick={() => navigate("/DashboardElecteur")}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all duration-150 shadow-md shadow-indigo-200/60"
        >
          Retour au tableau de bord
        </button>
      </div>
    </div>
  );

  const isListe       = election?.type === "LISTE";
  const isBinominal   = election?.type === "BINOMINAL";
  const maxSel        = getMaxSelections();
  const listesActives = isListe ? listes.filter(l => !l.fusionnee_dans || l.fusionnee_dans === 0) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300">

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-indigo-100 px-6 h-16 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/DashboardElecteur")}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold text-sm transition-colors hover:bg-indigo-50 px-3 py-1.5 rounded-lg"
          >
            <FiArrowLeft size={15} /> Retour
          </button>
          <div className="w-px h-5 bg-indigo-200" />
          <span className="text-lg font-black text-indigo-700 tracking-tight">🗳 eVote</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            {initiales}
          </div>
          <span className="text-sm font-semibold text-gray-700 hidden sm:block">{user.prenom} {user.nom}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">

        {/* ── EN-TÊTE ÉLECTION ────────────────────────────────────────────── */}
        <div className="bg-indigo-700 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-widest mb-2">Bulletin de vote</p>
              <h1 className="text-white text-xl font-black tracking-tight leading-tight">{election?.titre}</h1>
              <p className="text-indigo-300 text-xs mt-2">
                {election?.date_debut
                  ? new Date(election.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                  : "—"
                }
                {" → "}
                {election?.date_fin
                  ? new Date(election.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
                  : "—"
                }
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/30 tracking-wider">
                {election?.type}
              </span>
              {isListe && etatTour && (
                <span className="bg-white/25 text-white text-[11px] font-black px-3 py-1.5 rounded-full border border-white/40 flex items-center gap-1.5">
                  <FiRepeat size={10} /> Tour {etatTour.tour}
                </span>
              )}
            </div>
          </div>
          {election?.date_fin && (
            <div className="mt-5 pt-4 border-t border-white/20">
              <CountdownTimer
                dateFin={election.date_fin}
                onExpired={() => setError("Le temps de vote est écoulé. Le dépouillement va démarrer automatiquement.")}
              />
            </div>
          )}
        </div>

        {/* Bandeau nouveau tour */}
        {isListe && etatTour && etatTour.tour > 1 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FiRepeat className="text-orange-600" size={14} />
            </div>
            <div>
              <p className="font-bold text-orange-800 text-sm">Tour {etatTour.tour} — Nouveau tour ouvert</p>
              <p className="text-orange-600 text-xs mt-0.5">Aucune liste n'a obtenu la majorité absolue au tour précédent. Votez à nouveau parmi les listes restantes.</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-xl border border-indigo-100 p-4 mb-5 flex items-start gap-3 shadow-sm">
          <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <FiAlertCircle className="text-indigo-600" size={14} />
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">
            {isBinominal
              ? "Sélectionnez exactement 2 candidats pour valider votre vote."
              : isListe
              ? "Sélectionnez une liste. Une majorité absolue (> 50%) est nécessaire — sans vainqueur, un nouveau tour sera organisé."
              : "Sélectionnez un candidat pour valider votre vote."
            }
          </p>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-5 flex items-center gap-2 text-sm font-medium">
            <FiAlertCircle size={14} /> {error}
          </div>
        )}

        {/* ── SCRUTIN LISTE ───────────────────────────────────────────────── */}
        {isListe && (
          <div className="space-y-3 mb-24">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest px-1 mb-4">Listes candidates</p>
            {listesActives.length === 0 && (
              <div className="bg-white rounded-xl border border-indigo-100 p-8 text-center">
                <p className="text-gray-400 text-sm">Aucune liste disponible pour ce tour.</p>
              </div>
            )}
            {listesActives.map((liste) => {
              const isSelected     = selected.includes(liste.id_liste);
              const listeCandidats = candidats.filter(c => c.liste_id === liste.id_liste);
              return (
                <div
                  key={liste.id_liste}
                  onClick={() => handleSelect(liste.id_liste)}
                  className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-100"
                      : "border-gray-100 hover:border-indigo-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                        isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                      }`}>
                        {isSelected && <FiCheckCircle className="text-white" size={11} />}
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg">
                        {liste.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-gray-800">{liste.nom}</p>
                        <p className="text-xs text-gray-400">{liste.nb_candidats ?? 0} candidat(s)</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Sélectionné</span>
                    )}
                  </div>
                  {listeCandidats.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-gray-100">
                      {listeCandidats.map(c => (
                        <div key={c.id_candidat} className="flex items-center gap-2.5">
                          {c.photo
                            ? <img src={`http://localhost:5000${c.photo}`} alt={c.nom} className="w-9 h-9 rounded-full object-cover border-2 border-indigo-100 flex-shrink-0" />
                            : <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">{c.nom.charAt(0)}</div>
                          }
                          <div>
                            <p className="font-semibold text-gray-800 text-sm leading-tight">{c.nom}</p>
                            {c.parti && <p className="text-xs text-gray-400">{c.parti}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SCRUTIN UNINOMINAL / BINOMINAL ─────────────────────────────── */}
        {!isListe && (
          <div className="mb-24">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 px-1">
              Candidats
              {isBinominal && (
                <span className="ml-2 normal-case text-indigo-300 font-medium">
                  ({selected.length}/{maxSel} sélectionné{selected.length > 1 ? "s" : ""})
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {candidats.map((c) => {
                const isSelected = selected.includes(c.id_candidat);
                const isDisabled = !isSelected && selected.length >= maxSel;
                return (
                  <div
                    key={c.id_candidat}
                    onClick={() => !isDisabled && handleSelect(c.id_candidat)}
                    className={`bg-white rounded-2xl border-2 p-5 transition-all duration-200 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-100"
                        : isDisabled
                        ? "border-gray-100 opacity-50 cursor-not-allowed"
                        : "border-gray-100 hover:border-indigo-200 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {c.photo
                          ? <img src={`http://localhost:5000${c.photo}`} alt={c.nom} className="w-14 h-14 rounded-xl object-cover border-2 border-indigo-100" />
                          : <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500 text-xl"><FiUser /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-black text-gray-800 leading-tight">{c.nom}</p>
                            {c.parti && (
                              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5">{c.parti}</span>
                            )}
                            {c.age && <p className="text-xs text-gray-400 mt-1">{c.age} ans</p>}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5 ${
                            isSelected ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                          }`}>
                            {isSelected && <FiCheckCircle className="text-white" size={11} />}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-indigo-100">
                        <span className="text-xs font-bold text-indigo-600">✓ Sélectionné</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BARRE DE VOTE STICKY ────────────────────────────────────────── */}
        <div className="bg-white/95 backdrop-blur rounded-2xl border border-indigo-100 p-5 sticky bottom-6 shadow-2xl shadow-indigo-200/40">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-bold text-gray-800 text-sm">
                {selected.length === 0
                  ? "Aucun choix sélectionné"
                  : isListe
                  ? `Liste : ${listes.find(l => selected.includes(l.id_liste))?.nom ?? ""}`
                  : `${selected.length} candidat${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`
                }
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                ⚠️ Action irréversible
                {isListe && etatTour && <span className="ml-2 text-indigo-400">— Tour {etatTour.tour}</span>}
              </p>
            </div>
            <button
              onClick={handleVote}
              disabled={submitting || selected.length === 0 || (isBinominal && selected.length < 2)}
              className={`flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white transition-all duration-150 ${
                submitting || selected.length === 0 || (isBinominal && selected.length < 2)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-200/60"
              }`}
            >
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi…</>
                : <><FiCheckCircle size={15} /> Confirmer mon vote</>
              }
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}




