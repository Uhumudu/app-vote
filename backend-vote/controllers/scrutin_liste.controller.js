// backend/controllers/scrutin_liste.controller.js
import { pool } from "../config/db.js";
import { depouilllerTour } from "../jobs/scrutin_liste.job.js";

const SEUIL_ELIMINATION = 5;
const SEUIL_FUSION      = 10;
const MAJORITE_ABSOLUE  = 50;

// ─── VOTER (scrutin LISTE, tours successifs) ────────────────────────────────
export const voterListe = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { liste_id }   = req.body;
    const electeurId     = req.user.id;

    // 1. Vérifier l'élection
    const [elecRows] = await pool.execute(
      `SELECT e.statut, e.tour_courant, e.nb_sieges, e.titre, e.date_fin, s.type
       FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.id_election = ?`,
      [electionId]
    );
    if (!elecRows.length)
      return res.status(404).json({ message: "Élection introuvable" });

    const { statut, tour_courant, titre, type, date_fin } = elecRows[0];

    if (type !== "LISTE")
      return res.status(400).json({ message: "Ce vote est réservé aux scrutins de liste" });
    if (statut !== "EN_COURS")
      return res.status(403).json({ message: "L'élection n'est pas en cours" });

    // Vérifier que date_fin n'est pas dépassée
    if (new Date() > new Date(date_fin))
      return res.status(403).json({ message: "Le temps de vote est écoulé" });

    // 2. Vérifier inscription
    const [inscription] = await pool.execute(
      `SELECT electeur_id FROM electeur_election
       WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );
    if (!inscription.length)
      return res.status(403).json({ message: "Vous n'êtes pas inscrit à cette élection" });

    // 3. Déjà voté à ce tour ?
    const [dejaVote] = await pool.execute(
      `SELECT id_vote_tour FROM vote_tour
       WHERE electeur_id = ? AND election_id = ? AND tour = ?`,
      [electeurId, electionId, tour_courant]
    );
    if (dejaVote.length)
      return res.status(403).json({ message: "Vous avez déjà voté à ce tour" });

    // 4. Vérifier que la liste appartient à l'élection
    const [listeExiste] = await pool.execute(
      `SELECT id_liste FROM liste WHERE id_liste = ? AND election_id = ?`,
      [liste_id, electionId]
    );
    if (!listeExiste.length)
      return res.status(400).json({ message: "Liste invalide" });

    // 5. Enregistrer le vote
    await pool.execute(
      `INSERT INTO vote_tour (election_id, electeur_id, liste_id, tour)
       VALUES (?, ?, ?, ?)`,
      [electionId, electeurId, liste_id, tour_courant]
    );

    // 6. Marquer a_vote
    await pool.execute(
      `UPDATE electeur_election SET a_vote = 1
       WHERE electeur_id = ? AND election_id = ?`,
      [electeurId, electionId]
    );

    // 7. Calculer le temps restant pour informer l'électeur
    const msRestant   = new Date(date_fin) - new Date();
    const minRestant  = Math.max(0, Math.floor(msRestant / 60000));

    res.json({
      message:       "Vote enregistré avec succès",
      tour:          tour_courant,
      temps_restant: `${minRestant} minute${minRestant > 1 ? "s" : ""} restante${minRestant > 1 ? "s" : ""}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── DÉPOUILLER UN TOUR (manuel par l'admin) ────────────────────────────────
export const depouiller = async (req, res) => {
  try {
    const { electionId } = req.params;
    const adminId        = req.user.id;

    // Vérifier que l'admin est propriétaire
    const [elecRows] = await pool.execute(
      `SELECT e.id_election, s.type FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.id_election = ? AND e.admin_id = ?`,
      [electionId, adminId]
    );
    if (!elecRows.length)
      return res.status(403).json({ message: "Élection introuvable ou accès refusé" });

    if (elecRows[0].type !== "LISTE")
      return res.status(400).json({ message: "Cette action ne concerne que les scrutins LISTE" });

    // Créer le tour si c'est le premier dépouillement
    const [existingTours] = await pool.execute(
      `SELECT COUNT(*) AS cnt FROM tour_election WHERE election_id = ?`,
      [electionId]
    );
    if (existingTours[0].cnt === 0) {
      await pool.execute(
        `INSERT INTO tour_election (election_id, numero_tour, statut)
         VALUES (?, 1, 'EN_COURS')`,
        [electionId]
      );
    }

    // Déléguer à la fonction partagée
    const result = await depouilllerTour(parseInt(electionId));

    return res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─── FUSIONNER DEUX LISTES ──────────────────────────────────────────────────
export const fusionnerListes = async (req, res) => {
  try {
    const { electionId }                = req.params;
    const { liste_source, liste_cible } = req.body;
    const adminId                       = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT id_election, tour_courant FROM election
       WHERE id_election = ? AND admin_id = ?`,
      [electionId, adminId]
    );
    if (!elecRows.length)
      return res.status(403).json({ message: "Accès refusé" });

    const { tour_courant } = elecRows[0];

    await pool.execute(
      `INSERT INTO fusion_liste (election_id, tour, liste_source, liste_cible)
       VALUES (?, ?, ?, ?)`,
      [electionId, tour_courant, liste_source, liste_cible]
    );

    // Transférer les votes de la liste source vers la liste cible
    await pool.execute(
      `UPDATE vote_tour SET liste_id = ?
       WHERE liste_id = ? AND election_id = ?`,
      [liste_cible, liste_source, electionId]
    );

    res.json({
      message:      "Fusion enregistrée",
      liste_source,
      liste_cible,
      tour:         tour_courant,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── RÉSULTATS PAR TOUR ─────────────────────────────────────────────────────
export const getResultatsTours = async (req, res) => {
  try {
    const { electionId } = req.params;

    const [tours] = await pool.execute(
      `SELECT * FROM tour_election
       WHERE election_id = ?
       ORDER BY numero_tour ASC`,
      [electionId]
    );

    const toursDetail = await Promise.all(tours.map(async (t) => {
      const [votes] = await pool.execute(
        `SELECT vt.liste_id, l.nom AS nom_liste, COUNT(*) AS nb_votes
         FROM vote_tour vt
         JOIN liste l ON l.id_liste = vt.liste_id
         WHERE vt.election_id = ? AND vt.tour = ?
         GROUP BY vt.liste_id
         ORDER BY nb_votes DESC`,
        [electionId, t.numero_tour]
      );

      const total = votes.reduce((s, r) => s + Number(r.nb_votes), 0);
      return {
        ...t,
        votes: votes.map(v => ({
          ...v,
          nb_votes:    Number(v.nb_votes),
          pourcentage: total > 0
            ? Math.round((Number(v.nb_votes) / total) * 10000) / 100
            : 0,
        })),
        total_votes: total,
      };
    }));

    // Sièges finaux
    const [sieges] = await pool.execute(
      `SELECT sl.liste_id, l.nom AS nom_liste, sl.nb_sieges
       FROM siege_liste sl
       JOIN liste l ON l.id_liste = sl.liste_id
       WHERE sl.election_id = ?
       ORDER BY sl.nb_sieges DESC`,
      [electionId]
    );

    const [elec] = await pool.execute(
      `SELECT e.id_election, e.titre, e.statut, e.tour_courant,
              e.nb_sieges, e.date_fin, s.type
       FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.id_election = ?`,
      [electionId]
    );

    res.json({
      election: elec[0] || null,
      tours:    toursDetail,
      sieges,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── ÉTAT DU TOUR COURANT (pour l'électeur) ─────────────────────────────────
export const getEtatTour = async (req, res) => {
  try {
    const { electionId } = req.params;
    const electeurId     = req.user.id;

    const [elecRows] = await pool.execute(
      `SELECT e.id_election, e.titre, e.statut, e.tour_courant,
              e.nb_sieges, e.date_fin, s.type
       FROM election e
       JOIN scrutin s ON s.election_id = e.id_election
       WHERE e.id_election = ?`,
      [electionId]
    );
    if (!elecRows.length)
      return res.status(404).json({ message: "Élection introuvable" });

    const election = elecRows[0];

    // Temps restant
    const msRestant  = new Date(election.date_fin) - new Date();
    const secRestant = Math.max(0, Math.floor(msRestant / 1000));

    // Listes actives pour ce tour
    const [listes] = await pool.execute(
      `SELECT l.id_liste, l.nom,
              COUNT(DISTINCT c.id_candidat) AS nb_candidats,
              COALESCE(
                (SELECT 1 FROM fusion_liste f
                 WHERE f.liste_source = l.id_liste
                   AND f.election_id = l.election_id
                 LIMIT 1),
                0
              ) AS fusionnee
       FROM liste l
       LEFT JOIN candidat c ON c.liste_id = l.id_liste
       WHERE l.election_id = ?
       GROUP BY l.id_liste`,
      [electionId]
    );

    // A déjà voté à ce tour ?
    const [voteActuel] = await pool.execute(
      `SELECT id_vote_tour FROM vote_tour
       WHERE electeur_id = ? AND election_id = ? AND tour = ?`,
      [electeurId, electionId, election.tour_courant]
    );

    res.json({
      election,
      tour:              election.tour_courant,
      a_vote_ce_tour:    voteActuel.length > 0,
      temps_restant_sec: secRestant,
      listes,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



