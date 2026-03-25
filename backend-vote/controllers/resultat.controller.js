// backend/controllers/resultat.controller.js
import { pool } from "../config/db.js";

// ================= RESULTATS COMPLETS D'UNE ELECTION =================
export const getResultatsElection = async (req, res) => {
  try {
    const { electionId } = req.params;

    // Vérifier que l'élection existe
    const [elecRows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin, s.type AS type_scrutin
       FROM election e
       JOIN scrutin s ON e.id_election = s.election_id
       WHERE e.id_election = ?`,
      [electionId]
    );

    if (elecRows.length === 0) {
      return res.status(404).json({ message: "Élection introuvable" });
    }

    const election = elecRows[0];
    const isListe  = election.type_scrutin === "LISTE";

    // ─── Total électeurs inscrits (commun à tous les types) ───────────────
    const [totalElecteursRows] = await pool.execute(
      `SELECT COUNT(*) AS total_electeurs FROM electeur_election WHERE election_id = ?`,
      [electionId]
    );
    const totalElecteurs = Number(totalElecteursRows[0].total_electeurs);

    // ─── Total votes exprimés ─────────────────────────────────────────────
    // LISTE  → vote_tour (1 ligne par électeur par tour, on prend le tour courant)
    // AUTRES → table vote
    let totalVotes = 0;

    if (isListe) {
      // Nombre d'électeurs distincts ayant voté (tous tours confondus,
      // ou uniquement a_vote = 1 dans electeur_election — plus fiable)
      const [voteListeRows] = await pool.execute(
        `SELECT COUNT(*) AS total_votes
         FROM electeur_election
         WHERE election_id = ? AND a_vote = 1`,
        [electionId]
      );
      totalVotes = Number(voteListeRows[0].total_votes);
    } else {
      const [voteRows] = await pool.execute(
        `SELECT COUNT(*) AS total_votes FROM vote WHERE election_id = ?`,
        [electionId]
      );
      totalVotes = Number(voteRows[0].total_votes);
    }

    const tauxParticipation = totalElecteurs > 0
      ? Math.round((totalVotes / totalElecteurs) * 10000) / 100
      : 0;

    // ─── Résultats par candidat (UNINOMINAL / BINOMINAL) ──────────────────
    const [candidatsRows] = await pool.execute(`
      SELECT c.id_candidat, c.nom, c.parti, c.age, c.photo,
             COUNT(v.id_vote) AS nb_votes,
             ROUND(
               CASE WHEN ? > 0 THEN (COUNT(v.id_vote) * 100.0 / ?) ELSE 0 END,
               2
             ) AS pourcentage
      FROM candidat c
      LEFT JOIN vote v ON c.id_candidat = v.candidat_id
      WHERE c.election_id = ?
      GROUP BY c.id_candidat
      ORDER BY nb_votes DESC
    `, [totalVotes, totalVotes, electionId]);

    // ─── Résultats par liste (LISTE) ──────────────────────────────────────
    // On compte depuis vote_tour en prenant le dernier tour courant
    const [listesRows] = await pool.execute(`
      SELECT l.id_liste, l.nom AS nom_liste,
             COUNT(vt.id_vote_tour) AS nb_votes,
             ROUND(
               CASE WHEN ? > 0 THEN (COUNT(vt.id_vote_tour) * 100.0 / ?) ELSE 0 END,
               2
             ) AS pourcentage,
             GROUP_CONCAT(DISTINCT c.nom ORDER BY c.id_candidat SEPARATOR ', ') AS candidats
      FROM liste l
      LEFT JOIN candidat c  ON c.liste_id = l.id_liste
      LEFT JOIN vote_tour vt ON vt.liste_id = l.id_liste
                             AND vt.election_id = l.election_id
                             AND vt.tour = (
                               SELECT tour_courant FROM election WHERE id_election = l.election_id
                             )
      WHERE l.election_id = ?
      GROUP BY l.id_liste
      ORDER BY nb_votes DESC
    `, [totalVotes, totalVotes, electionId]);

    res.json({
      election: {
        ...election,
        type_scrutin: election.type_scrutin,  // expose le champ unifié
      },
      totalVotes,
      totalElecteurs,
      tauxParticipation,
      candidats: candidatsRows.map(c => ({ ...c, nb_votes: Number(c.nb_votes) })),
      listes:    listesRows.map(l    => ({ ...l, nb_votes: Number(l.nb_votes) })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= RESULTATS DE TOUTES LES ELECTIONS DE L'ADMIN =================
export const getResultatsAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [elections] = await pool.execute(`
      SELECT e.id_election, e.titre, e.statut, e.date_debut, e.date_fin,
             s.type AS type_scrutin,
             COUNT(DISTINCT ee.electeur_id) AS total_electeurs,
             -- Pour LISTE on compte a_vote, pour les autres on compte les votes réels
             SUM(CASE WHEN s.type = 'LISTE' THEN ee.a_vote ELSE 0 END)          AS votes_liste,
             COUNT(DISTINCT CASE WHEN s.type != 'LISTE' THEN v.id_vote END)      AS votes_autres
      FROM election e
      JOIN scrutin s ON e.id_election = s.election_id
      LEFT JOIN vote v ON v.election_id = e.id_election
      LEFT JOIN electeur_election ee ON ee.election_id = e.id_election
      WHERE e.admin_id = ?
      GROUP BY e.id_election
      ORDER BY e.date_debut DESC
    `, [adminId]);

    const result = elections.map(e => {
      const totalVotes = e.type_scrutin === "LISTE"
        ? Number(e.votes_liste)
        : Number(e.votes_autres);
      const totalElecteurs = Number(e.total_electeurs);
      return {
        id_election:       e.id_election,
        titre:             e.titre,
        statut:            e.statut,
        date_debut:        e.date_debut,
        date_fin:          e.date_fin,
        type_scrutin:      e.type_scrutin,
        totalVotes,
        totalElecteurs,
        tauxParticipation: totalElecteurs > 0
          ? Math.round((totalVotes / totalElecteurs) * 10000) / 100
          : 0,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


