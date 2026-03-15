// backend/jobs/scrutin_liste.job.js
import { pool } from "../config/db.js";

const SEUIL_ELIMINATION = 5;   // < 5%  → éliminée
const MAJORITE_ABSOLUE  = 50;  // > 50% → vainqueur

// ─── LOGIQUE DE DÉPOUILLEMENT D'UN TOUR ─────────────────────────────────────
// Partagée entre le cron (auto) et le controller (manuel admin)
export const depouilllerTour = async (electionId) => {

  const [elecRows] = await pool.execute(
    `SELECT e.id_election, e.tour_courant, e.nb_sieges,
            e.statut, e.duree_tour_minutes, s.type
     FROM election e
     JOIN scrutin s ON s.election_id = e.id_election
     WHERE e.id_election = ?`,
    [electionId]
  );

  if (!elecRows.length)    throw new Error("Élection introuvable");

  const { tour_courant, nb_sieges, statut, duree_tour_minutes, type } = elecRows[0];

  if (type !== "LISTE")      throw new Error("Pas un scrutin de liste");
  if (statut === "TERMINEE") throw new Error("Élection déjà terminée");

  // Compter les votes du tour courant
  const [votesParListe] = await pool.execute(
    `SELECT vt.liste_id, COUNT(*) AS nb_votes
     FROM vote_tour vt
     WHERE vt.election_id = ? AND vt.tour = ?
     GROUP BY vt.liste_id`,
    [electionId, tour_courant]
  );

  const totalVotes = votesParListe.reduce((s, r) => s + Number(r.nb_votes), 0);

  if (totalVotes === 0) throw new Error("Aucun vote enregistré pour ce tour");

  // Calculer les pourcentages
  const resultats = votesParListe.map(r => ({
    liste_id:    r.liste_id,
    nb_votes:    Number(r.nb_votes),
    pourcentage: Math.round((Number(r.nb_votes) / totalVotes) * 10000) / 100,
  }));

  // ── Vainqueur trouvé ? ────────────────────────────────────────────────────
  const gagnant = resultats.find(r => r.pourcentage > MAJORITE_ABSOLUE);

  if (gagnant) {
    const nbSiegesTotal = nb_sieges || 29;
    const bonus         = Math.floor(nbSiegesTotal / 2);
    const restant       = nbSiegesTotal - bonus;
    const autresVotes   = totalVotes - gagnant.nb_votes;

    const sieges = [{ liste_id: gagnant.liste_id, nb_sieges: bonus }];

    for (const r of resultats) {
      if (r.liste_id === gagnant.liste_id)   continue;
      if (r.pourcentage < SEUIL_ELIMINATION) continue;
      const s = autresVotes > 0
        ? Math.round((r.nb_votes / autresVotes) * restant)
        : 0;
      if (s > 0) sieges.push({ liste_id: r.liste_id, nb_sieges: s });
    }

    for (const s of sieges) {
      await pool.execute(
        `INSERT INTO siege_liste (election_id, liste_id, nb_sieges)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE nb_sieges = ?`,
        [electionId, s.liste_id, s.nb_sieges, s.nb_sieges]
      );
    }

    await pool.execute(
      `UPDATE tour_election
       SET statut = 'GAGNANT_TROUVE', gagnant_id = ?, date_fin = NOW()
       WHERE election_id = ? AND numero_tour = ?`,
      [gagnant.liste_id, electionId, tour_courant]
    );

    await pool.execute(
      `UPDATE election SET statut = 'TERMINEE' WHERE id_election = ?`,
      [electionId]
    );

    console.log(
      `✅ [CRON] Élection ${electionId} — Tour ${tour_courant}` +
      ` — Vainqueur liste ${gagnant.liste_id} (${gagnant.pourcentage}%)`
    );

    return { terminer: true, gagnant, sieges, resultats, tour: tour_courant };
  }

  // ── Pas de vainqueur → ouvrir le tour suivant ─────────────────────────────
  const prochainTour = tour_courant + 1;

  // Clore le tour courant
  await pool.execute(
    `UPDATE tour_election
     SET statut = 'TERMINE', date_fin = NOW()
     WHERE election_id = ? AND numero_tour = ?`,
    [electionId, tour_courant]
  );

  // date_fin du prochain tour = maintenant + duree_tour_minutes
  const dureeMin    = duree_tour_minutes || 1440;
  const dateFinTour = new Date(Date.now() + dureeMin * 60000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // Mettre à jour date_fin de l'élection (= fin du nouveau tour courant)
  await pool.execute(
    `UPDATE election
     SET tour_courant = ?, date_fin = ?
     WHERE id_election = ?`,
    [prochainTour, dateFinTour, electionId]
  );

  // Réinitialiser a_vote pour tous les électeurs
  await pool.execute(
    `UPDATE electeur_election SET a_vote = 0 WHERE election_id = ?`,
    [electionId]
  );

  // Créer le nouveau tour avec sa date de fin
  await pool.execute(
    `INSERT INTO tour_election (election_id, numero_tour, statut, date_fin_tour)
     VALUES (?, ?, 'EN_COURS', ?)`,
    [electionId, prochainTour, dateFinTour]
  );

  console.log(
    `🔄 [CRON] Élection ${electionId} — Tour ${tour_courant} sans majorité` +
    ` → Tour ${prochainTour} ouvert jusqu'au ${dateFinTour}`
  );

  return {
    terminer:     false,
    prochainTour,
    dateFinTour,
    resultats,
    tour:         tour_courant,
  };
};

// ─── CRON : VÉRIFICATION AUTOMATIQUE (appelé toutes les 60s) ─────────────────
export const checkDepouillementAuto = async () => {
  try {
    // Élections LISTE EN_COURS dont date_fin (= fin du tour courant) est dépassée
    const [elections] = await pool.execute(
      `SELECT e.id_election, e.tour_courant, e.date_fin, e.duree_tour_minutes
       FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.statut = 'EN_COURS'
         AND s.type = 'LISTE'
         AND e.date_fin <= NOW()`
    );

    for (const elec of elections) {
      try {
        // Créer le tour 1 s'il n'existe pas encore
        const [existCount] = await pool.execute(
          `SELECT COUNT(*) AS cnt FROM tour_election WHERE election_id = ?`,
          [elec.id_election]
        );

        if (existCount[0].cnt === 0) {
          await pool.execute(
            `INSERT INTO tour_election (election_id, numero_tour, statut, date_fin_tour)
             VALUES (?, 1, 'EN_COURS', ?)`,
            [elec.id_election, elec.date_fin]
          );
          console.log(`📋 [CRON] Tour 1 créé pour élection ${elec.id_election}`);
        }

        await depouilllerTour(elec.id_election);

      } catch (err) {
        const msgIgnore = ["Aucun vote", "déjà terminée", "Pas un scrutin"];
        if (!msgIgnore.some(m => err.message.includes(m))) {
          console.error(
            `❌ [CRON] Erreur dépouillement élection ${elec.id_election}:`,
            err.message
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ [CRON] Erreur générale checkDepouillementAuto:", err.message);
  }
};
