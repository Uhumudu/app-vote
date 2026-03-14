// backend/controllers/scrutinListe.controller.js
import { pool } from "../config/db.js";

// ================= VOTER POUR UNE LISTE =================
export const voterListe = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { liste_id }   = req.body;
    const electeurId     = req.user.id;

    const [elecRows] = await pool.execute(`
      SELECT e.statut, e.titre, s.type, s.tour_actuel
      FROM election e
      JOIN scrutin s ON s.election_id = e.id_election
      WHERE e.id_election = ?
    `, [electionId]);

    if (!elecRows.length)
      return res.status(404).json({ message: "Élection introuvable" });

    const { statut, type, tour_actuel } = elecRows[0];

    if (type !== "LISTE")
      return res.status(400).json({ message: "Ce n'est pas un scrutin de liste" });
    if (statut !== "EN_COURS")
      return res.status(403).json({ message: "L'élection n'est pas en cours" });

    const [inscription] = await pool.execute(`
      SELECT a_vote FROM electeur_election
      WHERE electeur_id = ? AND election_id = ?
    `, [electeurId, electionId]);

    if (!inscription.length)
      return res.status(403).json({ message: "Non inscrit à cette élection" });

    const [dejaVote] = await pool.execute(`
      SELECT id_vote FROM vote
      WHERE electeur_id = ? AND election_id = ? AND tour = ?
    `, [electeurId, electionId, tour_actuel]);

    if (dejaVote.length)
      return res.status(403).json({ message: `Vous avez déjà voté au tour ${tour_actuel}` });

    const [listeQualif] = await pool.execute(`
      SELECT id FROM liste_tour
      WHERE election_id = ? AND liste_id = ? AND tour = ? AND statut = 'qualifiee'
    `, [electionId, liste_id, tour_actuel]);

    if (!listeQualif.length)
      return res.status(403).json({ message: "Cette liste n'est pas qualifiée pour ce tour" });

    await pool.execute(`
      INSERT INTO vote (electeur_id, election_id, liste_id, tour)
      VALUES (?, ?, ?, ?)
    `, [electeurId, electionId, liste_id, tour_actuel]);

    await pool.execute(`
      UPDATE electeur_election SET a_vote = 1
      WHERE electeur_id = ? AND election_id = ?
    `, [electeurId, electionId]);

    res.json({ message: "Vote enregistré", tour: tour_actuel });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= CLÔTURER UN TOUR =================
export const cloturerTour = async (req, res) => {
  try {
    const { id: electionId } = req.params; // ✅ election.routes.js utilise /:id
    const adminId            = req.user.id;

    const [elecRows] = await pool.execute(`
      SELECT e.statut, s.id_scrutin, s.tour_actuel, s.nb_sieges, s.seuil_majorite
      FROM election e
      JOIN scrutin s ON s.election_id = e.id_election
      WHERE e.id_election = ? AND e.admin_id = ?
    `, [electionId, adminId]);

    if (!elecRows.length)
      return res.status(403).json({ message: "Accès refusé" });

    const { id_scrutin, tour_actuel, nb_sieges, seuil_majorite } = elecRows[0];

    if (!nb_sieges)
      return res.status(400).json({ message: "Le nombre de sièges n'est pas défini pour cette élection" });

    const [votes] = await pool.execute(`
      SELECT liste_id, COUNT(*) AS total
      FROM vote
      WHERE election_id = ? AND tour = ?
      GROUP BY liste_id
    `, [electionId, tour_actuel]);

    const totalVotes = votes.reduce((s, r) => s + r.total, 0);

    if (totalVotes === 0)
      return res.status(400).json({ message: "Aucun vote enregistré pour ce tour" });

    const resultats = votes
      .map(v => ({
        liste_id:    v.liste_id,
        total:       v.total,
        pourcentage: (v.total / totalVotes) * 100,
      }))
      .sort((a, b) => b.pourcentage - a.pourcentage);

    const premiere        = resultats[0];
    const primeMajoritaire = Math.ceil(nb_sieges / 2);
    const siegesRestants   = nb_sieges - primeMajoritaire;

    // ---- CAS 1 : majorité absolue → élection terminée ----
    if (premiere.pourcentage > seuil_majorite || tour_actuel >= 2) {
      for (const r of resultats) {
        const siegesProp = r.liste_id === premiere.liste_id
          ? primeMajoritaire + Math.round((r.pourcentage / 100) * siegesRestants)
          : Math.round((r.pourcentage / 100) * siegesRestants);

        await pool.execute(`
          INSERT INTO resultat_liste (election_id, liste_id, tour, total_votes, pourcentage, nb_sieges)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            total_votes=VALUES(total_votes),
            pourcentage=VALUES(pourcentage),
            nb_sieges=VALUES(nb_sieges)
        `, [electionId, r.liste_id, tour_actuel, r.total, r.pourcentage, siegesProp]);
      }

      await pool.execute(
        `UPDATE election SET statut='TERMINEE' WHERE id_election = ?`,
        [electionId]
      );

      const msg = premiere.pourcentage > seuil_majorite
        ? "Majorité absolue atteinte — élection terminée"
        : "2nd tour — élection terminée";

      return res.json({ message: msg, tour: tour_actuel, gagnant: premiere, resultats, second_tour: false });
    }

    // ---- CAS 2 : 1er tour sans majorité → préparer le 2nd tour ----
    for (const r of resultats) {
      await pool.execute(`
        INSERT INTO resultat_liste (election_id, liste_id, tour, total_votes, pourcentage)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          total_votes=VALUES(total_votes),
          pourcentage=VALUES(pourcentage)
      `, [electionId, r.liste_id, tour_actuel, r.total, r.pourcentage]);
    }

    const qualifiees = [];
    for (const r of resultats) {
      let statut;
      if (r.pourcentage > 10)      statut = "qualifiee";
      else if (r.pourcentage >= 5) statut = "fusion";
      else                          statut = "eliminee";

      await pool.execute(`
        INSERT INTO liste_tour (election_id, liste_id, tour, statut)
        VALUES (?, ?, 2, ?)
        ON DUPLICATE KEY UPDATE statut=VALUES(statut)
      `, [electionId, r.liste_id, statut]);

      if (statut === "qualifiee") qualifiees.push(r);
    }

    await pool.execute(
      `UPDATE scrutin SET tour_actuel = 2 WHERE id_scrutin = ?`,
      [id_scrutin]
    );

    await pool.execute(
      `UPDATE electeur_election SET a_vote = 0 WHERE election_id = ?`,
      [electionId]
    );

    return res.json({
      message:     "1er tour clôturé — 2nd tour ouvert",
      tour:         tour_actuel,
      second_tour:  true,
      qualifiees,
      resultats,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};