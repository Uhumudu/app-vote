-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : mar. 24 mars 2026 à 09:00
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
  `nom` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parti` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `election_id` int NOT NULL,
  `liste_id` int DEFAULT NULL,
  `age` int DEFAULT NULL,
  PRIMARY KEY (`id_candidat`),
  KEY `election_id` (`election_id`),
  KEY `liste_id` (`liste_id`)
) ENGINE=MyISAM AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `candidat`
--

INSERT INTO `candidat` (`id_candidat`, `nom`, `parti`, `photo`, `election_id`, `liste_id`, `age`) VALUES
(1, 'nasser abdel', 'Parti A', NULL, 7, NULL, 45),
(2, 'Jean Dupont', 'Parti A', NULL, 8, 1, NULL),
(3, 'Lorin jean-jacques', 'Parti A', NULL, 8, 1, NULL),
(4, 'zinedine zidane', 'RM', NULL, 10, NULL, 47),
(5, 'André iniesta', 'FCB', NULL, 10, NULL, 43),
(6, 'Lionel Messç', 'FCB', NULL, 11, NULL, 38),
(7, 'Cristiano Ronaldo', 'RMA', NULL, 11, NULL, 41),
(8, 'issa', 'partie C', '/uploads/photo-1773351350329.jpg', 7, NULL, 45),
(9, 'jean marie', 'RCF', '/uploads/photo-1773351591854.jpg', 7, NULL, 43),
(10, 'teukon', 'RMC', '/uploads/photo-1773353691368.jpg', 8, 2, NULL),
(11, 'Sanses', 'potlan', '/uploads/photo-1773388144785.jpg', 8, 2, NULL),
(12, 'moussa', 'LEY', NULL, 13, 3, NULL),
(13, 'JOEL Aziz', 'PCA', NULL, 13, 4, NULL),
(14, 'Zollo etetam', 'APC', NULL, 13, 5, NULL),
(15, 'Saley daouda', 'LEY', NULL, 13, 3, NULL),
(16, 'Labrane ali', 'RFI', NULL, 13, 3, NULL),
(17, 'Dian briel', 'PCA', NULL, 13, 4, NULL),
(18, 'Frontine dupont', 'QQQ', NULL, 13, 4, NULL),
(19, 'Ahmet Adam', 'QQQ', NULL, 13, 3, NULL),
(20, 'Zebra zioli', 'PRI', NULL, 13, 5, NULL),
(21, 'Zidane Luve', 'PRE', NULL, 13, 5, NULL),
(22, 'Dinor pen', 'DNP', NULL, 13, 5, NULL),
(23, 'Alex digne', 'ATT', NULL, 13, 5, NULL),
(24, 'Mouhamed Bello', 'MSA', NULL, 13, 3, NULL),
(25, 'Nani Durant', 'DRN', NULL, 13, 3, NULL),
(26, 'Anas djibril', 'MAS', NULL, 13, 4, NULL),
(27, 'Luck Quaresma', 'PRT', NULL, 13, 4, NULL),
(28, 'Arthur', 'QSA', NULL, 13, 5, NULL),
(29, 'Malic Diouf', 'DOR', NULL, 13, 4, NULL),
(30, 'PELE', 'BRE', NULL, 14, NULL, 70),
(31, 'MARADONA', 'ARG', NULL, 14, NULL, 49),
(32, 'Moussa', 'MOU', NULL, 16, NULL, 34),
(33, 'HUNER', 'MIN', '/uploads/photo-1774263715441.jpg', 16, NULL, 34),
(34, 'MINATO', 'MINA', '/uploads/photo-1774301584350.jpg', 17, NULL, 38),
(35, 'SASUKE', 'SAS', '/uploads/photo-1774301622838.jpg', 17, NULL, 18),
(36, 'SUNG JING WOO', 'SJW', '/uploads/photo-1774301733236.jpg', 17, NULL, 29);

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
(45, 14, 0),
(21, 14, 0),
(48, 17, 0),
(49, 17, 0),
(50, 17, 0),
(51, 17, 0),
(52, 17, 0);

-- --------------------------------------------------------

--
-- Structure de la table `election`
--

DROP TABLE IF EXISTS `election`;
CREATE TABLE IF NOT EXISTS `election` (
  `id_election` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `date_debut` datetime NOT NULL,
  `date_fin` datetime NOT NULL,
  `statut` enum('EN_ATTENTE','APPROUVEE','EN_COURS','TERMINEE','SUSPENDUE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'EN_ATTENTE',
  `admin_id` int NOT NULL,
  `tour_courant` int DEFAULT '1',
  `nb_sieges` int DEFAULT '0',
  `duree_tour_minutes` int DEFAULT '1440',
  PRIMARY KEY (`id_election`),
  KEY `admin_id` (`admin_id`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `election`
--

INSERT INTO `election` (`id_election`, `titre`, `description`, `date_debut`, `date_fin`, `statut`, `admin_id`, `tour_courant`, `nb_sieges`, `duree_tour_minutes`) VALUES
(3, 'elec', 'AZERTYU', '2026-03-05 11:00:00', '2026-03-07 11:00:00', 'TERMINEE', 27, 1, 0, 1440),
(4, 'Election juge general', 'IL s\'agit de voté le juge principal et son vice', '2026-03-06 12:00:00', '2026-03-09 21:00:00', 'TERMINEE', 28, 1, 0, 1440),
(5, 'Vote de mon mari', 'yes voter mon mari', '2026-03-08 12:00:00', '2026-03-08 21:00:00', 'TERMINEE', 29, 1, 0, 1440),
(6, 'Election du minsboys', 'Vots un bureau', '2026-03-09 11:00:00', '2026-03-11 13:00:00', 'EN_ATTENTE', 30, 1, 0, 1440),
(7, 'election ISMA', 'whaouuuuu c\'est bien', '2026-03-15 11:00:00', '2026-03-16 12:00:00', 'TERMINEE', 31, 1, 0, 1440),
(8, 'election DOCTOR', 'Elu le docteur principal de l\'hopital central', '2026-03-15 12:00:00', '2026-03-16 13:00:00', 'TERMINEE', 31, 1, 0, 1440),
(9, 'election BOSSTORI', 'MMMMMMMMMMMMMMMMMMMMMMMMmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm', '2026-03-12 10:40:00', '2026-03-12 10:55:00', 'TERMINEE', 37, 1, 0, 1440),
(10, 'Elire Meilleur milieu', 'election du milieu le plus prolifique de tout les temps', '2026-03-12 11:45:00', '2026-03-12 12:00:00', 'TERMINEE', 37, 1, 0, 1440),
(11, 'Election messi ou ronaldo ', 'voter le joueur le plus fort entre messi et ronaldo', '2026-03-12 13:03:00', '2026-03-12 14:00:00', 'TERMINEE', 37, 1, 0, 1440),
(12, 'Election Liste Test', 'Cette election est faite pour voir si l\'election de type liste fonctionne correctement', '2026-03-15 14:00:00', '2026-03-15 20:00:00', 'TERMINEE', 44, 1, 6, 360),
(13, 'Election Listes', 'Election pour tester le fonctionnement des elections de type liste', '2026-03-21 15:00:00', '2026-03-21 16:00:00', 'EN_COURS', 31, 1, 6, 120),
(14, 'Test Uni', 'Neynar ou ronaldinho', '2026-03-21 15:20:00', '2026-03-21 16:00:00', 'TERMINEE', 31, 1, NULL, NULL),
(15, 'Uninominal', 'RTYU', '2026-03-23 10:35:00', '2026-03-23 10:55:00', 'TERMINEE', 46, 1, NULL, NULL),
(16, 'moussmania', 'sdfgh', '2026-03-23 11:59:00', '2026-03-23 12:30:00', 'TERMINEE', 46, 1, NULL, NULL),
(17, 'ELECTION UNINOMINALE', 'Pour faire les tests pour voir si le scrutin uninominal fonctionne coorectement', '2026-03-23 22:25:00', '2026-03-23 22:50:00', 'TERMINEE', 25, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `fusion_liste`
--

DROP TABLE IF EXISTS `fusion_liste`;
CREATE TABLE IF NOT EXISTS `fusion_liste` (
  `id_fusion` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `tour` int NOT NULL,
  `liste_source` int NOT NULL,
  `liste_cible` int NOT NULL,
  PRIMARY KEY (`id_fusion`),
  KEY `election_id` (`election_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `liste`
--

DROP TABLE IF EXISTS `liste`;
CREATE TABLE IF NOT EXISTS `liste` (
  `id_liste` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
(3, 'Liste violet', 13),
(4, 'Liste jaune', 13),
(5, 'Liste Marron', 13);

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `id_notification` int NOT NULL AUTO_INCREMENT,
  `utilisateur_id` int NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `date_envoi` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notification`),
  KEY `utilisateur_id` (`utilisateur_id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notification`
--

INSERT INTO `notification` (`id_notification`, `utilisateur_id`, `type`, `message`, `date_envoi`) VALUES
(1, 0, 'PLATFORM_CONFIG', '{\"nomPlateforme\":\"Evote\",\"urlFrontend\":\"https://localhost:5173\",\"emailSupport\":\"evoteplus1@gmail.com\",\"votesMultiples\":false,\"inscriptionOuverte\":true,\"maintenance\":false,\"dureeSession\":\"24\"}', '2026-03-18 21:44:03');

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
-- Structure de la table `scrutin`
--

DROP TABLE IF EXISTS `scrutin`;
CREATE TABLE IF NOT EXISTS `scrutin` (
  `id_scrutin` int NOT NULL AUTO_INCREMENT,
  `type` enum('UNINOMINAL','BINOMINAL','LISTE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `regle_vote` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `election_id` int DEFAULT NULL,
  PRIMARY KEY (`id_scrutin`),
  UNIQUE KEY `election_id` (`election_id`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `scrutin`
--

INSERT INTO `scrutin` (`id_scrutin`, `type`, `regle_vote`, `election_id`) VALUES
(1, 'UNINOMINAL', NULL, 3),
(2, 'BINOMINAL', NULL, 4),
(3, 'BINOMINAL', NULL, 5),
(4, 'LISTE', NULL, 6),
(5, 'BINOMINAL', NULL, 7),
(6, 'LISTE', NULL, 8),
(7, 'UNINOMINAL', NULL, 9),
(8, 'UNINOMINAL', NULL, 10),
(9, 'UNINOMINAL', NULL, 11),
(10, 'LISTE', NULL, 12),
(11, 'LISTE', NULL, 13),
(12, 'UNINOMINAL', NULL, 14),
(13, 'UNINOMINAL', NULL, 15),
(14, 'UNINOMINAL', NULL, 16),
(15, 'UNINOMINAL', NULL, 17);

-- --------------------------------------------------------

--
-- Structure de la table `siege_liste`
--

DROP TABLE IF EXISTS `siege_liste`;
CREATE TABLE IF NOT EXISTS `siege_liste` (
  `id_siege` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `liste_id` int NOT NULL,
  `nb_sieges` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id_siege`),
  KEY `election_id` (`election_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tour_election`
--

DROP TABLE IF EXISTS `tour_election`;
CREATE TABLE IF NOT EXISTS `tour_election` (
  `id_tour` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `numero_tour` int NOT NULL,
  `statut` enum('EN_COURS','TERMINE','GAGNANT_TROUVE') COLLATE utf8mb4_unicode_ci DEFAULT 'EN_COURS',
  `gagnant_id` int DEFAULT NULL,
  `date_debut` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_fin` timestamp NULL DEFAULT NULL,
  `date_fin_tour` datetime DEFAULT NULL,
  PRIMARY KEY (`id_tour`),
  KEY `election_id` (`election_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `tour_election`
--

INSERT INTO `tour_election` (`id_tour`, `election_id`, `numero_tour`, `statut`, `gagnant_id`, `date_debut`, `date_fin`, `date_fin_tour`) VALUES
(1, 8, 1, 'EN_COURS', NULL, '2026-03-15 12:53:20', NULL, NULL),
(2, 13, 1, 'EN_COURS', NULL, '2026-03-23 10:16:06', NULL, '2026-03-21 16:00:00');

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

DROP TABLE IF EXISTS `utilisateur`;
CREATE TABLE IF NOT EXISTS `utilisateur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('SUPER_ADMIN','ADMIN_ELECTION','ELECTEUR','ADMIN_ELECTION_PENDING') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ELECTEUR',
  `actif` tinyint(1) DEFAULT '1',
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `role`, `actif`, `date_creation`) VALUES
(49, 'akashi', 'akash', 'akashi@gmail.com', '$2b$10$js3sgbvbVSo.dAGhLDbX1uIkF8Y1qDaGeKX7n4XlBHlduZDJPzqm6', 'ELECTEUR', 1, '2026-03-23 21:37:44'),
(17, 'saley', 'ali', 'ali@gmail.com', '$2b$10$K3YiUjiRWYTGZ1mlhKFQ8.IDIK/llpBR5WW8IZq5z3n2XhYCrfuSC', 'ELECTEUR', 1, '2026-02-17 02:18:52'),
(19, 'eva', 'priso', 'prisoEva@gmail.com', '$2b$10$OMKDfL9I49igYaypQYUr3ug2DWg5mwliuvBG5x64eTSez//D2n4A.', 'ADMIN_ELECTION', 1, '2026-02-20 11:02:11'),
(20, 'don', 'kou', 'don@gmail.com', 'don098', 'ADMIN_ELECTION', 1, '2026-02-21 14:09:41'),
(48, 'Takao', 'midorima', 'takao@gmail.com', '$2b$10$PAyXqZIYcAnOYMFzzXWCJ.jfTOy5VrAB4WtZMMhubwd0wQzYu6Sly', 'ELECTEUR', 1, '2026-03-23 21:37:00'),
(22, 'leyla', 'njoya', 'njoyaleyla4@gmail.com', '$2b$10$e5225GKx1GAcERKub63yB./fYDQ41SeSyITw30AiY7HpCqxq58252', 'SUPER_ADMIN', 1, '2026-02-24 13:45:58'),
(24, 'Super', 'Admin', 'superadmin@mail.com', '$2b$10$Mr5gA3DVq1fCZmS0EI03Ee4pLfuSh3EU7JRzkrqylcNVZV7tnFclK', 'SUPER_ADMIN', 1, '2026-02-24 14:52:00'),
(25, 'Admin', 'Election', 'adminelection@mail.com', '$2b$10$3gz/zmfIIGXPstXLs7UpqOi5NDp368NENizPrm7B7ellMRazS.6NW', 'ADMIN_ELECTION', 1, '2026-02-24 14:52:00'),
(26, 'Electeur', 'Test', 'electeur@mail.com', '$2b$10$bLFbopdvQa22zf0LSZq1duXJHoZGWf.7Fgve0kUmcNKdXha7NrAsy', 'ELECTEUR', 1, '2026-02-24 14:52:00'),
(27, 'Mouss', 'abdou', 'moussabdou@gmail.com', '$2b$10$.VN0YU0r7KbwGwEFsgETy.9iEw.Vu2hi/xm3UsZdBb0.nVFn6LwGa', 'ADMIN_ELECTION', 1, '2026-03-04 14:01:22'),
(28, 'salemon', 'andré', 'andre@gmail.com', '$2b$10$Rrf2b1S0f.2LWyJM.tqsAul3pkY6E7EWhglplCNn6lL9s8nrflc5a', 'ADMIN_ELECTION', 1, '2026-03-04 22:04:10'),
(29, 'ley', 'soumiatou', 'ley@gmail.com', '$2b$10$WfQxuQRCBt11atmOtDfMKup2l5QzJ2Aia1IfVF1iNNlMOkMnxD/Iu', 'ADMIN_ELECTION', 1, '2026-03-08 04:14:06'),
(30, 'Dadi', 'salifou', 'dadi@gmail.com', '$2b$10$3F21AWd0ceteaiAQ0.nSnuzxF854zOaNBFMgBsnKVoxcQoIzWi3cC', 'ADMIN_ELECTION_PENDING', 1, '2026-03-08 12:14:41'),
(31, 'dina', 'moudingo', 'dina@gmail.com', '$2b$10$/lYNesSitV5dU6XfHublIuyRP/DlesrqyPAA0pTBSjWP.NcVmoVpW', 'ADMIN_ELECTION', 1, '2026-03-10 21:34:24'),
(32, 'Jean', 'Dupont', 'jean@mail.com', '$2b$10$b.ggu3DihUVr9R/vDoOFLeGezBMO/B2gRBd.f1GpitUUB579ezaMG', 'ELECTEUR', 1, '2026-03-11 21:14:19'),
(33, 'Marie', 'Ndzi', 'marie@mail.com', '$2b$10$yP4T3aCTANI0IbK7V36kuenl22CcaRB4D6ca/o8MBdaDXEYf.sBA2', 'ELECTEUR', 0, '2026-03-11 21:14:19'),
(47, 'cmr', 'elecam', 'elecam@gmail.com', '$2b$10$gZbrq6lkdKlFyZRPtLYqvOy2iLuMjhD2j/Dr6NMhYFakY0SWKfaZu', 'ELECTEUR', 1, '2026-03-23 21:26:16'),
(35, 'fandeu', 'soukoudjou', 'fandeusokoudjou@icloud.com', '$2b$10$KVVK7kVJYvR0dBiR.XBbGuz64x.S39/amd.GJkcxEQPZRPagj/9I2', 'ELECTEUR', 1, '2026-03-12 08:20:37'),
(36, 'sali', 'ahmed', 'ahmed@gmail.com', '$2b$10$y55S5aZAwfzkfq1aaliEVeB6V0gsG32HgMHOJRVSC3ujH/azk2lfe', 'ELECTEUR', 1, '2026-03-12 09:02:39'),
(37, 'lucas', 'xavi', 'lucasxavi@gmail.com', '$2b$10$RjZsQZDGXeZ2jVQ2jD/LsetuK8IJzazS8cM27lXy9WcsHXsNBX/Ly', 'ADMIN_ELECTION', 1, '2026-03-12 10:24:20'),
(38, 'ozil', 'mensut', 'ozilmensut@gmail.com', '$2b$10$gZ7I16EnGBgBASBDXb8uw.38mtoQQVXirdBkrmsovBMMzzQimobkK', 'ELECTEUR', 1, '2026-03-12 10:34:26'),
(39, 'zidane', 'zizou', 'zizou@gmail.com', '$2b$10$tDovScw8jD/QcTfPbR4AdeUVOwfbHBURdyhtxS5USHQAgOD7PUG5W', 'ELECTEUR', 1, '2026-03-12 11:22:32'),
(40, 'salmane', 'salihou', 'salmanesale34@gmail.com', '$2b$10$RokWB2UYJmrIfWCAb.3oouQB3xxqWM6zWecM/ZBRMGQvpV9GQlFuO', 'ELECTEUR', 1, '2026-03-13 07:45:43'),
(41, 'sage', 'pierre', 'sage@gmail.com', '$2b$10$CfFU1TeDHcpmr6moJy8jRuzcmZKXEPI7bbDcLvG5ZrfmgmfsWqgyO', 'ELECTEUR', 1, '2026-03-13 07:46:29'),
(42, 'Arthur', 'Dyon', 'arthur@gmail.com', '$2b$10$jmJnUAR9IcEs7ZEgcBL3feTGbfKveea/AG6rTJRpqPIPdOp7V6AWi', 'ELECTEUR', 1, '2026-03-13 07:47:43'),
(43, 'mouhamed', 'yaou', 'mouamed@gmail.com', '$2b$10$o/1PG7u5BkHkQ55cSKaxeuylo.AaPr62iW4kXSKO5unETIgz7V.x.', 'ELECTEUR', 1, '2026-03-13 08:23:53'),
(44, 'sani', 'belle', 'sani@gmail.com', '$2b$10$HkQUAg2FBB9QecLkimf3Ku.fE.O0fOEnRE8G2Vs3iZS2CItZfNep6', 'ADMIN_ELECTION', 1, '2026-03-21 12:05:35'),
(45, 'quenta', 'luve', 'quenta@gmail.com', '$2b$10$Kmp8x/Shdo8XqV9cQrZhWePyl4hhA3NrpuwUj65dsn46g6//gOogW', 'ELECTEUR', 1, '2026-03-21 13:56:57'),
(46, 'redmon', 'arrrr', 'redmon@gmail.com', '$2b$10$gbaBBjvERIXrgpXqGsQKGu42A7wQ7JhzpJf3MmF6Nm/.eBncJHFrW', 'ADMIN_ELECTION', 1, '2026-03-23 10:13:52'),
(50, 'kuruko', 'fantome', 'kuruko@gmail.com', '$2b$10$pOnfBfApaBKGTXckUXD4yuwDH4uhzHkugcsi1zZCisbM3saMqwlAm', 'ELECTEUR', 1, '2026-03-23 21:38:31'),
(51, 'kise', 'dort', 'kise@gmail.com', '$2b$10$486rK0CPUii9T9MAsHLIwuypk1QJBgikOWN8lCFZY6aW3mE6JradK', 'ELECTEUR', 1, '2026-03-23 21:39:07'),
(52, 'krilin', 'pitie', 'krilin@gmail.com', '$2b$10$X5ElDSiFOLpe0sBs6ngxuey1tNvX8BvXZ0Zd3cV.0L9tJnQV/jbGq', 'ELECTEUR', 1, '2026-03-23 21:40:13');

-- --------------------------------------------------------

--
-- Structure de la table `vote`
--

DROP TABLE IF EXISTS `vote`;
CREATE TABLE IF NOT EXISTS `vote` (
  `id_vote` int NOT NULL AUTO_INCREMENT,
  `date_vote` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `electeur_id` int NOT NULL,
  `candidat_id` int NOT NULL,
  `election_id` int NOT NULL,
  `candidat2_id` int DEFAULT NULL,
  PRIMARY KEY (`id_vote`),
  UNIQUE KEY `electeur_id` (`electeur_id`,`election_id`),
  KEY `candidat_id` (`candidat_id`),
  KEY `election_id` (`election_id`),
  KEY `candidat2_id` (`candidat2_id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vote`
--

INSERT INTO `vote` (`id_vote`, `date_vote`, `electeur_id`, `candidat_id`, `election_id`, `candidat2_id`) VALUES
(1, '2026-03-12 12:58:07', 39, 6, 11, NULL),
(2, '2026-03-15 13:20:52', 35, 8, 7, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `vote_tour`
--

DROP TABLE IF EXISTS `vote_tour`;
CREATE TABLE IF NOT EXISTS `vote_tour` (
  `id_vote_tour` int NOT NULL AUTO_INCREMENT,
  `election_id` int NOT NULL,
  `electeur_id` int NOT NULL,
  `liste_id` int NOT NULL,
  `tour` int NOT NULL DEFAULT '1',
  `date_vote` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_vote_tour`),
  UNIQUE KEY `unique_vote_tour` (`electeur_id`,`election_id`,`tour`),
  KEY `election_id` (`election_id`),
  KEY `liste_id` (`liste_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
