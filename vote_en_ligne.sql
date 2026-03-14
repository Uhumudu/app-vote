-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : sam. 14 mars 2026 à 15:56
-- Version du serveur : 8.0.31
-- Version de PHP : 8.0.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `vote_en_ligne`
--

-- --------------------------------------------------------

--
-- Structure de la table `candidat`
--

DROP TABLE IF EXISTS `candidat`;
CREATE TABLE IF NOT EXISTS `candidat` (
  `id_candidat` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parti` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `election_id` int NOT NULL,
  `liste_id` int DEFAULT NULL,
  `age` int DEFAULT NULL,
  PRIMARY KEY (`id_candidat`),
  KEY `election_id` (`election_id`),
  KEY `liste_id` (`liste_id`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `candidat`
--

INSERT INTO `candidat` (`id_candidat`, `nom`, `parti`, `photo`, `election_id`, `liste_id`, `age`) VALUES
(1, 'nasser abdel', 'Parti A', '/uploads/photo-1773418695047.jpg', 7, NULL, 33),
(2, 'Jean Dupont', 'Parti A', '/uploads/photo-1773482968788.jpg', 8, 1, NULL),
(3, 'Lorin jean-jacques', 'Parti A', '/uploads/photo-1773482987075.jpg', 8, 1, NULL),
(4, 'zinedine zidane', 'RM', NULL, 10, NULL, 47),
(5, 'André iniesta', 'FCB', NULL, 10, NULL, 43),
(6, 'Lionel Messç', 'FCB', NULL, 11, NULL, 38),
(7, 'Cristiano Ronaldo', 'RMA', NULL, 11, NULL, 41),
(8, 'issa', 'partie C', '/uploads/photo-1773351350329.jpg', 7, NULL, 45),
(9, 'jean marie', 'RCF', '/uploads/photo-1773351591854.jpg', 7, NULL, 43),
(10, 'teukon', 'RMC', '/uploads/photo-1773353691368.jpg', 8, 2, NULL),
(11, 'Sanses', 'potlan', '/uploads/photo-1773388144785.jpg', 8, 2, NULL),
(12, 'Abba', 'FDC', NULL, 13, 3, NULL),
(13, 'duer', 'SAS', NULL, 13, 4, NULL),
(14, 'adam', 'QSP', NULL, 13, 5, NULL),
(15, 'line', 'FDC', NULL, 13, 4, NULL),
(16, 'azie', 'der', NULL, 13, 5, NULL),
(17, 'juertie', 'DES', NULL, 13, 3, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `electeur_election`
--

DROP TABLE IF EXISTS `electeur_election`;
CREATE TABLE IF NOT EXISTS `electeur_election` (
  `electeur_id` int NOT NULL,
  `election_id` int NOT NULL,
  `a_vote` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`electeur_id`,`election_id`),
  KEY `election_id` (`election_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `electeur_election`
--

INSERT INTO `electeur_election` (`electeur_id`, `election_id`, `a_vote`) VALUES
(32, 7, 0),
(33, 7, 0),
(23, 7, 0),
(34, 7, 0),
(35, 7, 0),
(36, 8, 0),
(38, 10, 0),
(39, 11, 1),
(39, 8, 0),
(23, 8, 0),
(40, 8, 0),
(41, 8, 0),
(42, 8, 0),
(43, 8, 0),
(45, 13, 1),
(46, 13, 1),
(47, 13, 1),
(48, 13, 1);

-- --------------------------------------------------------

--
-- Structure de la table `election`
--

DROP TABLE IF EXISTS `election`;
CREATE TABLE IF NOT EXISTS `election` (
  `id_election` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `statut` enum('EN_ATTENTE','APPROUVEE','EN_COURS','TERMINEE','SUSPENDUE') COLLATE utf8mb4_unicode_ci DEFAULT 'EN_ATTENTE',
  `admin_id` int NOT NULL,
  PRIMARY KEY (`id_election`),
  KEY `admin_id` (`admin_id`)
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `election`
--

INSERT INTO `election` (`id_election`, `titre`, `description`, `date_debut`, `date_fin`, `statut`, `admin_id`) VALUES
(13, 'tEst LISTE', 'tester liste scrutin', '2026-03-14 14:20:00', '2026-03-14 14:50:00', 'TERMINEE', 44),
(12, 'ElectionTest Liste', 'Tester si le scrutin liste fonctionne correcte', '2026-03-14 13:20:00', '2026-03-14 14:00:00', 'TERMINEE', 44),
(3, 'elec', 'AZERTYU', '2026-03-05 11:00:00', '2026-03-07 11:00:00', 'TERMINEE', 27),
(4, 'Election juge general', 'IL s\'agit de voté le juge principal et son vice', '2026-03-06 12:00:00', '2026-03-09 21:00:00', 'EN_ATTENTE', 28),
(5, 'Vote de mon mari', 'yes voter mon mari', '2026-03-08 12:00:00', '2026-03-08 21:00:00', 'TERMINEE', 29),
(6, 'Election du minsboys', 'Vots un bureau', '2026-03-09 11:00:00', '2026-03-11 13:00:00', 'EN_ATTENTE', 30),
(7, 'election ISMA', 'whaouuuuu c\'est bien', '2026-03-15 11:00:00', '2026-03-16 12:00:00', 'APPROUVEE', 31),
(8, 'election DOCTOR', 'Elu le docteur principal de l\'hopital central', '2026-03-15 10:00:00', '2026-03-16 11:00:00', 'APPROUVEE', 31),
(9, 'election BOSSTORI', 'MMMMMMMMMMMMMMMMMMMMMMMMmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm', '2026-03-12 10:40:00', '2026-03-12 10:55:00', 'TERMINEE', 37),
(10, 'Elire Meilleur milieu', 'election du milieu le plus prolifique de tout les temps', '2026-03-12 11:45:00', '2026-03-12 12:00:00', 'TERMINEE', 37),
(11, 'Election messi ou ronaldo ', 'voter le joueur le plus fort entre messi et ronaldo', '2026-03-12 13:03:00', '2026-03-12 14:00:00', 'TERMINEE', 37);

-- --------------------------------------------------------

--
-- Structure de la table `liste`
--

DROP TABLE IF EXISTS `liste`;
CREATE TABLE IF NOT EXISTS `liste` (
  `id_liste` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `election_id` int NOT NULL,
  PRIMARY KEY (`id_liste`),
  KEY `election_id` (`election_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `liste`
--

INSERT INTO `liste` (`id_liste`, `nom`, `election_id`) VALUES
(1, 'Liste A', 8),
(2, 'Liste rouge', 8),
(3, 'liste rouge', 13),
(4, 'Liste marron', 13),
(5, 'liste JAUNE', 13);

--
-- Déclencheurs `liste`
--
DROP TRIGGER IF EXISTS `after_liste_delete`;
DELIMITER $$
CREATE TRIGGER `after_liste_delete` AFTER DELETE ON `liste` FOR EACH ROW BEGIN
  DELETE FROM liste_tour 
  WHERE liste_id = OLD.id_liste AND election_id = OLD.election_id;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `after_liste_insert`;
DELIMITER $$
CREATE TRIGGER `after_liste_insert` AFTER INSERT ON `liste` FOR EACH ROW BEGIN
  INSERT INTO liste_tour (election_id, liste_id, tour, statut)
  VALUES (NEW.election_id, NEW.id_liste, 1, 'qualifiee');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `liste_tour`
--

DROP TABLE IF EXISTS `liste_tour`;
CREATE TABLE IF NOT EXISTS `liste_tour` (
  `id` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `liste_id` int NOT NULL,
  `tour` tinyint NOT NULL,
  `statut` enum('qualifiee','fusion','eliminee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'qualifiee',
  `liste_origine_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `election_id` (`election_id`,`liste_id`,`tour`),
  KEY `liste_id` (`liste_id`),
  KEY `liste_origine_id` (`liste_origine_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `liste_tour`
--

INSERT INTO `liste_tour` (`id`, `election_id`, `liste_id`, `tour`, `statut`, `liste_origine_id`) VALUES
(1, 13, 3, 1, 'qualifiee', NULL),
(2, 13, 4, 1, 'qualifiee', NULL),
(3, 13, 5, 1, 'qualifiee', NULL),
(4, 8, 1, 1, 'qualifiee', NULL),
(5, 8, 2, 1, 'qualifiee', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `date_envoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notification`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `resultat`
--

DROP TABLE IF EXISTS `resultat`;
CREATE TABLE IF NOT EXISTS `resultat` (
  `id_resultat` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `candidat_id` int NOT NULL,
  `total_votes` int DEFAULT '0',
  `pourcentage` float DEFAULT '0',
  PRIMARY KEY (`id_resultat`),
  KEY `election_id` (`election_id`),
  KEY `candidat_id` (`candidat_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `resultat_liste`
--

DROP TABLE IF EXISTS `resultat_liste`;
CREATE TABLE IF NOT EXISTS `resultat_liste` (
  `id_resultat` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `liste_id` int NOT NULL,
  `tour` tinyint NOT NULL DEFAULT '1',
  `total_votes` int NOT NULL DEFAULT '0',
  `pourcentage` float NOT NULL DEFAULT '0',
  `nb_sieges` int DEFAULT NULL,
  PRIMARY KEY (`id_resultat`),
  UNIQUE KEY `election_id` (`election_id`,`liste_id`,`tour`),
  KEY `liste_id` (`liste_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `scrutin`
--

DROP TABLE IF EXISTS `scrutin`;
CREATE TABLE IF NOT EXISTS `scrutin` (
  `id_scrutin` int NOT NULL AUTO_INCREMENT,
  `type` enum('UNINOMINAL','BINOMINAL','LISTE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `regle_vote` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `election_id` int DEFAULT NULL,
  `tour_actuel` tinyint NOT NULL DEFAULT '1',
  `nb_sieges` int DEFAULT NULL,
  `seuil_majorite` float NOT NULL DEFAULT '50',
  `statut_tour` enum('EN_ATTENTE','OUVERT','CLOTURE') COLLATE utf8mb4_unicode_ci DEFAULT 'EN_ATTENTE',
  PRIMARY KEY (`id_scrutin`),
  UNIQUE KEY `election_id` (`election_id`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `scrutin`
--

INSERT INTO `scrutin` (`id_scrutin`, `type`, `regle_vote`, `election_id`, `tour_actuel`, `nb_sieges`, `seuil_majorite`, `statut_tour`) VALUES
(1, 'UNINOMINAL', NULL, 3, 1, NULL, 50, 'EN_ATTENTE'),
(2, 'BINOMINAL', NULL, 4, 1, NULL, 50, 'EN_ATTENTE'),
(3, 'BINOMINAL', NULL, 5, 1, NULL, 50, 'EN_ATTENTE'),
(4, 'LISTE', NULL, 6, 1, NULL, 50, 'EN_ATTENTE'),
(5, 'BINOMINAL', NULL, 7, 1, NULL, 50, 'EN_ATTENTE'),
(6, 'LISTE', NULL, 8, 1, 15, 50, 'EN_ATTENTE'),
(7, 'UNINOMINAL', NULL, 9, 1, NULL, 50, 'EN_ATTENTE'),
(8, 'UNINOMINAL', NULL, 10, 1, NULL, 50, 'EN_ATTENTE'),
(9, 'UNINOMINAL', NULL, 11, 1, NULL, 50, 'EN_ATTENTE'),
(10, 'LISTE', NULL, 12, 1, NULL, 50, 'EN_ATTENTE'),
(11, 'LISTE', NULL, 13, 1, 29, 50, 'EN_ATTENTE');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN','ADMIN_ELECTION','ELECTEUR','ADMIN_ELECTION_PENDING') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ELECTEUR',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `role`, `actif`, `date_creation`) VALUES
(23, 'ouhoumoudou', 'moussa', 'ouhoumoudmoussa91@gmail.com', '$2b$10$RY/vAmjm5UBscgWRWpjKoeFZUds4O0pZ8/JeI79d1mgjypMBnZc6e', 'SUPER_ADMIN', 1, '2026-02-24 14:45:48'),
(17, 'saley', 'ali', 'ali@gmail.com', '$2b$10$K3YiUjiRWYTGZ1mlhKFQ8.IDIK/llpBR5WW8IZq5z3n2XhYCrfuSC', 'ELECTEUR', 1, '2026-02-17 02:18:52'),
(19, 'eva', 'priso', 'prisoEva@gmail.com', '$2b$10$OMKDfL9I49igYaypQYUr3ug2DWg5mwliuvBG5x64eTSez//D2n4A.', 'ADMIN_ELECTION', 1, '2026-02-20 11:02:11'),
(20, 'don', 'kou', 'don@gmail.com', 'don098', 'ADMIN_ELECTION', 1, '2026-02-21 14:09:41'),
(21, 'moussa', 'youssouf', 'youssouf@gmail.com', '$2b$10$QD2nXbQ6kUDdZI5oFwVb8eL2bASXZSoylH3QbEcy1T2rv9chCaXoG', 'ADMIN_ELECTION', 1, '2026-02-22 07:56:38'),
(22, 'leyla', 'njoya', 'njoyaleyla4@gmail.com', '$2b$10$1K5xEofhMhL3v/UZXRs34e7nB497I7buXf9Ciz19uoWAKos7fWnQC', 'SUPER_ADMIN', 1, '2026-02-24 13:45:58'),
(24, 'Super', 'Admin', 'superadmin@mail.com', '$2b$10$Mr5gA3DVq1fCZmS0EI03Ee4pLfuSh3EU7JRzkrqylcNVZV7tnFclK', 'SUPER_ADMIN', 1, '2026-02-24 14:52:00'),
(25, 'Admin', 'Election', 'adminelection@mail.com', '$2b$10$3gz/zmfIIGXPstXLs7UpqOi5NDp368NENizPrm7B7ellMRazS.6NW', 'ADMIN_ELECTION', 1, '2026-02-24 14:52:00'),
(26, 'Electeur', 'Test', 'electeur@mail.com', '$2b$10$bLFbopdvQa22zf0LSZq1duXJHoZGWf.7Fgve0kUmcNKdXha7NrAsy', 'ELECTEUR', 1, '2026-02-24 14:52:00'),
(27, 'Mouss', 'abdou', 'moussabdou@gmail.com', '$2b$10$.VN0YU0r7KbwGwEFsgETy.9iEw.Vu2hi/xm3UsZdBb0.nVFn6LwGa', 'ADMIN_ELECTION', 1, '2026-03-04 14:01:22'),
(28, 'salemon', 'andré', 'andre@gmail.com', '$2b$10$Rrf2b1S0f.2LWyJM.tqsAul3pkY6E7EWhglplCNn6lL9s8nrflc5a', 'ADMIN_ELECTION_PENDING', 1, '2026-03-04 22:04:10'),
(29, 'ley', 'soumiatou', 'ley@gmail.com', '$2b$10$WfQxuQRCBt11atmOtDfMKup2l5QzJ2Aia1IfVF1iNNlMOkMnxD/Iu', 'ADMIN_ELECTION', 1, '2026-03-08 04:14:06'),
(30, 'Dadi', 'salifou', 'dadi@gmail.com', '$2b$10$3F21AWd0ceteaiAQ0.nSnuzxF854zOaNBFMgBsnKVoxcQoIzWi3cC', 'ADMIN_ELECTION_PENDING', 1, '2026-03-08 12:14:41'),
(31, 'dina', 'moudingo', 'dina@gmail.com', '$2b$10$/lYNesSitV5dU6XfHublIuyRP/DlesrqyPAA0pTBSjWP.NcVmoVpW', 'ADMIN_ELECTION', 1, '2026-03-10 21:34:24'),
(32, 'Jean', 'Dupont', 'jean@mail.com', '$2b$10$HkIgOt8lsu7Rz13jBquGEeMcfpu7w73OWnWi5K5pElv6juGNgTGwW', 'ELECTEUR', 1, '2026-03-11 21:14:19'),
(33, 'Marie', 'Ndzi', 'marie@mail.com', '$2b$10$.Jtk/seTbyLlPVKiFt1HZea40cyLpvh040/2OJrwXjoqgQcrQOxSq', 'ELECTEUR', 0, '2026-03-11 21:14:19'),
(34, 'mouss', 'abd', 'ouhoumoudmoussa2@gmail.com', '$2b$10$RXVOGHVVXrOYOj8TusBKS.exYUeNGidhnHsWHINdJ8OAfnIOUCCJW', 'ELECTEUR', 1, '2026-03-11 22:28:14'),
(35, 'fandeu', 'soukoudjou', 'fandeusokoudjou@icloud.com', '$2b$10$KVVK7kVJYvR0dBiR.XBbGuz64x.S39/amd.GJkcxEQPZRPagj/9I2', 'ELECTEUR', 1, '2026-03-12 08:20:37'),
(36, 'sali', 'ahmed', 'ahmed@gmail.com', '$2b$10$y55S5aZAwfzkfq1aaliEVeB6V0gsG32HgMHOJRVSC3ujH/azk2lfe', 'ELECTEUR', 1, '2026-03-12 09:02:39'),
(37, 'lucas', 'xavi', 'lucasxavi@gmail.com', '$2b$10$RjZsQZDGXeZ2jVQ2jD/LsetuK8IJzazS8cM27lXy9WcsHXsNBX/Ly', 'ADMIN_ELECTION', 1, '2026-03-12 10:24:20'),
(38, 'ozil', 'mensut', 'ozilmensut@gmail.com', '$2b$10$gZ7I16EnGBgBASBDXb8uw.38mtoQQVXirdBkrmsovBMMzzQimobkK', 'ELECTEUR', 1, '2026-03-12 10:34:26'),
(39, 'zidane', 'zizou', 'zizou@gmail.com', '$2b$10$tDovScw8jD/QcTfPbR4AdeUVOwfbHBURdyhtxS5USHQAgOD7PUG5W', 'ELECTEUR', 1, '2026-03-12 11:22:32'),
(40, 'salmane', 'salihou', 'salmanesale34@gmail.com', '$2b$10$RokWB2UYJmrIfWCAb.3oouQB3xxqWM6zWecM/ZBRMGQvpV9GQlFuO', 'ELECTEUR', 1, '2026-03-13 07:45:43'),
(41, 'sage', 'pierre', 'sage@gmail.com', '$2b$10$CfFU1TeDHcpmr6moJy8jRuzcmZKXEPI7bbDcLvG5ZrfmgmfsWqgyO', 'ELECTEUR', 1, '2026-03-13 07:46:29'),
(42, 'Arthur', 'Dyon', 'arthur@gmail.com', '$2b$10$jmJnUAR9IcEs7ZEgcBL3feTGbfKveea/AG6rTJRpqPIPdOp7V6AWi', 'ELECTEUR', 1, '2026-03-13 07:47:43'),
(43, 'mouhamed', 'yaou', 'mouamed@gmail.com', '$2b$10$o/1PG7u5BkHkQ55cSKaxeuylo.AaPr62iW4kXSKO5unETIgz7V.x.', 'ELECTEUR', 1, '2026-03-13 08:23:53'),
(44, 'yunus', 'azizu', 'yunus@gmail.com', '$2b$10$hOSMXayE9m9O.tx1aSG59OBoq.m1PNbYAaaKQJ9hQVJcY4pC2nRGy', 'ADMIN_ELECTION', 1, '2026-03-14 12:56:30'),
(45, 'lunne', 'perte', 'lunne@gmail.com', '$2b$10$Z6sJ9PyHIBWK0np4mO/QpO4wWIwZSgZU7PZklODqz7NJAsuF2aA4O', 'ELECTEUR', 1, '2026-03-14 13:04:45'),
(46, 'dupo', 'aziz', 'dupo@gmail.com', '$2b$10$258CsSNpjTXwD75PbE79muExEpUX44k7mDRVQ44QKsbcl0ADcLlPS', 'ELECTEUR', 1, '2026-03-14 13:05:29'),
(47, 'luve', 'lipe', 'luve@gmail.com', '$2b$10$E3DLhPaZWsVGwLh0CoE8mOSUIougx.ARbt6YS33RjZCTHZWyXw2HC', 'ELECTEUR', 1, '2026-03-14 13:06:09'),
(48, 'artur', 'jupe', 'artur@gmail.com', '$2b$10$taDREsF6/qdaNUybAbdLhewm6i0HWhaIu1fXhtxPRH5AoIE/LiAoW', 'ELECTEUR', 1, '2026-03-14 13:06:49');

-- --------------------------------------------------------

--
-- Structure de la table `vote`
--

DROP TABLE IF EXISTS `vote`;
CREATE TABLE IF NOT EXISTS `vote` (
  `id_vote` int NOT NULL AUTO_INCREMENT,
  `date_vote` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `electeur_id` int NOT NULL,
  `candidat_id` int DEFAULT NULL,
  `liste_id` int DEFAULT NULL,
  `tour` tinyint NOT NULL DEFAULT '1',
  `election_id` int NOT NULL,
  `candidat2_id` int DEFAULT NULL,
  PRIMARY KEY (`id_vote`),
  UNIQUE KEY `uq_vote_electeur_election_tour` (`electeur_id`,`election_id`,`tour`),
  KEY `candidat_id` (`candidat_id`),
  KEY `election_id` (`election_id`),
  KEY `candidat2_id` (`candidat2_id`),
  KEY `fk_vote_liste` (`liste_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vote`
--

INSERT INTO `vote` (`id_vote`, `date_vote`, `electeur_id`, `candidat_id`, `liste_id`, `tour`, `election_id`, `candidat2_id`) VALUES
(1, '2026-03-12 12:58:07', 39, 6, NULL, 1, 11, NULL),
(2, '2026-03-14 13:40:11', 45, NULL, 5, 1, 13, NULL),
(3, '2026-03-14 13:40:41', 46, NULL, 4, 1, 13, NULL),
(4, '2026-03-14 13:41:06', 47, NULL, 3, 1, 13, NULL),
(5, '2026-03-14 13:43:07', 48, NULL, 5, 1, 13, NULL);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
