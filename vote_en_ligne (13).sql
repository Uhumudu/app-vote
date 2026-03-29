-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : dim. 29 mars 2026 à 22:45
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
) ENGINE=MyISAM AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(73, 'manita luna', 'MAN', NULL, 20, 11, NULL),
(72, 'pendo', 'PEN', NULL, 20, 11, NULL),
(71, 'Varise', 'VAR', NULL, 20, 11, NULL),
(70, 'Guela doue', 'NAN', NULL, 20, 10, NULL),
(69, 'barcola', 'PSG', NULL, 20, 10, NULL),
(68, 'arturo vidal', 'AGR', NULL, 20, 10, NULL),
(67, 'Ley Kalicha', 'MOUSSA', NULL, 20, 10, NULL),
(66, 'Azizou abba', 'ABA', NULL, 20, 10, NULL),
(65, 'Carlors', 'QRA', NULL, 20, 10, NULL),
(64, 'Santa', 'AER', NULL, 20, 10, NULL),
(63, 'Sartouna', 'QSD', NULL, 20, 9, NULL),
(62, 'Habibou hamma', 'BVX', NULL, 20, 9, NULL),
(61, 'junior pont', 'VDE', NULL, 20, 9, NULL),
(60, 'Paul Durand', ' BAC', NULL, 20, 9, NULL),
(59, 'Marie Martin', 'rea', NULL, 20, 9, NULL),
(58, 'salmane dialla', 'PDA', NULL, 20, 9, NULL),
(30, 'PELE', 'BRE', NULL, 14, NULL, 70),
(31, 'MARADONA', 'ARG', NULL, 14, NULL, 49),
(32, 'Moussa', 'MOU', NULL, 16, NULL, 34),
(33, 'HUNER', 'MIN', '/uploads/photo-1774263715441.jpg', 16, NULL, 34),
(34, 'MINATO', 'MINA', '/uploads/photo-1774301584350.jpg', 17, NULL, 38),
(35, 'SASUKE', 'SAS', '/uploads/photo-1774301622838.jpg', 17, NULL, 18),
(36, 'SUNG JING WOO', 'SJW', '/uploads/photo-1774301733236.jpg', 17, NULL, 29),
(37, 'salmane dialla', 'PDA', NULL, 19, 6, NULL),
(38, 'Marie Martin', 'rea', NULL, 19, 6, NULL),
(39, 'Paul Durand', ' BAC', NULL, 19, 6, NULL),
(40, 'junior pont', 'VDE', NULL, 19, 6, NULL),
(41, 'Habibou hamma', 'BVX', NULL, 19, 6, NULL),
(42, 'Sartouna', 'QSD', NULL, 19, 6, NULL),
(43, 'Santa', 'AER', NULL, 19, 7, NULL),
(44, 'Carlors', 'QRA', NULL, 19, 7, NULL),
(45, 'Azizou abba', 'ABA', NULL, 19, 7, NULL),
(46, 'Ley Kalicha', 'MOUSSA', NULL, 19, 7, NULL),
(47, 'arturo vidal', 'AGR', NULL, 19, 7, NULL),
(48, 'barcola', 'PSG', NULL, 19, 7, NULL),
(49, 'Guela doue', 'NAN', NULL, 19, 7, NULL),
(50, 'Varise', 'VAR', NULL, 19, 8, NULL),
(51, 'pendo', 'PEN', NULL, 19, 8, NULL),
(52, 'manita luna', 'MAN', NULL, 19, 8, NULL),
(53, 'Nani taro', 'AEZ', NULL, 19, 8, NULL),
(54, 'Arez hades', 'ABA', NULL, 19, 8, NULL),
(55, 'Zonoto bin', 'PDA', NULL, 19, 8, NULL),
(56, 'Avenir sure', 'BVX', NULL, 19, 8, NULL),
(57, 'Salma virane', 'PDA', '/uploads/photo-1774350451633.jpg', 19, 6, NULL),
(74, 'Nani taro', 'AEZ', NULL, 20, 11, NULL),
(75, 'Arez hades', 'ABA', NULL, 20, 11, NULL),
(76, 'Zonoto bin', 'PDA', NULL, 20, 11, NULL),
(77, 'Avenir sure', 'BVX', NULL, 20, 11, NULL),
(78, 'Lamine mall', NULL, '/uploads/photo-1774366896077.jpg', 20, 9, NULL),
(79, 'Chiner pouss', 'PAR', '/uploads/photo-1774370224669.jpg', 21, NULL, 23),
(80, 'LINE ProuvQSD', NULL, NULL, 21, NULL, 34);

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
(48, 17, 1),
(49, 17, 1),
(50, 17, 0),
(51, 17, 1),
(52, 17, 0),
(67, 20, 1),
(66, 20, 1),
(55, 19, 0),
(56, 19, 0),
(57, 19, 0),
(58, 19, 0),
(59, 19, 0),
(60, 19, 0),
(61, 19, 0),
(62, 19, 0),
(63, 19, 0),
(64, 19, 0),
(65, 19, 0),
(68, 20, 1),
(69, 20, 1),
(70, 20, 0),
(71, 20, 1),
(72, 20, 1),
(73, 20, 1),
(74, 20, 1),
(75, 20, 1),
(76, 20, 1),
(77, 21, 1),
(78, 21, 1),
(79, 21, 1),
(80, 17, 1);

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
) ENGINE=MyISAM AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `election`
--

INSERT INTO `election` (`id_election`, `titre`, `description`, `date_debut`, `date_fin`, `statut`, `admin_id`, `tour_courant`, `nb_sieges`, `duree_tour_minutes`) VALUES
(31, 'Monstral Election', 'GDGDJD', '2026-03-28 13:00:00', '2026-03-28 14:00:00', 'EN_ATTENTE', 89, 1, NULL, NULL),
(4, 'Election juge general', 'IL s\'agit de voté le juge principal et son vice', '2026-03-06 12:00:00', '2026-03-09 21:00:00', 'TERMINEE', 28, 1, 0, 1440),
(30, 'MONTE ELECTION', 'AZERTYU', '2026-03-28 12:00:00', '2026-03-28 13:00:00', 'EN_ATTENTE', 88, 1, NULL, NULL),
(6, 'Election du minsboys', 'Vots un bureau', '2026-03-09 11:00:00', '2026-03-11 13:00:00', 'EN_ATTENTE', 30, 1, 0, 1440),
(7, 'election ISMA', 'whaouuuuu c\'est bien', '2026-03-15 11:00:00', '2026-03-16 12:00:00', 'TERMINEE', 31, 1, 0, 1440),
(8, 'election DOCTOR', 'Elu le docteur principal de l\'hopital central', '2026-03-15 12:00:00', '2026-03-16 13:00:00', 'TERMINEE', 31, 1, 0, 1440),
(28, 'ABIR ELECTION', 'AZERTYU', '2026-03-28 12:00:00', '2026-03-28 13:00:00', 'SUSPENDUE', 86, 1, NULL, NULL),
(29, 'PISTE ELECTION', 'AZERTYU', '2026-03-28 12:00:00', '2026-03-28 13:00:00', 'EN_ATTENTE', 87, 1, NULL, NULL),
(10, 'Elire Meilleur milieu', 'election du milieu le plus prolifique de tout les temps', '2026-03-12 11:45:00', '2026-03-12 12:00:00', 'TERMINEE', 37, 1, 0, 1440),
(11, 'Election messi ou ronaldo ', 'voter le joueur le plus fort entre messi et ronaldo', '2026-03-12 13:03:00', '2026-03-12 14:00:00', 'TERMINEE', 37, 1, 0, 1440),
(12, 'Election Liste Test', 'Cette election est faite pour voir si l\'election de type liste fonctionne correctement', '2026-03-15 14:00:00', '2026-03-15 20:00:00', 'TERMINEE', 44, 1, 6, 360),
(23, 'Election Pont', 'GGZJ', '2026-03-26 23:03:00', '2026-03-26 23:20:00', 'SUSPENDUE', 81, 1, NULL, NULL),
(24, 'QSQS', 'YOO', '2026-03-28 11:00:00', '2026-03-28 13:00:00', 'EN_ATTENTE', 82, 1, NULL, NULL),
(25, 'Moussa', 'hjkk', '2026-03-28 12:00:00', '2026-03-28 14:00:00', 'EN_ATTENTE', 25, 1, NULL, NULL),
(26, 'QSQS', 'RYUUU', '2026-03-28 11:00:00', '2026-03-28 13:00:00', 'SUSPENDUE', 83, 1, NULL, NULL),
(27, 'PAM PAM PAM', 'YOOOO', '2026-03-28 12:00:00', '2026-03-28 14:05:00', 'EN_ATTENTE', 85, 1, NULL, NULL),
(17, 'ELECTION UNINOMINALE', 'Pour faire les tests pour voir si le scrutin uninominal fonctionne coorectement', '2026-03-26 13:10:00', '2026-03-26 13:20:00', 'TERMINEE', 25, 1, NULL, NULL),
(33, 'ELECTION DU PRESIDENT', 'ERTYUIODKJHGHJKL ', '2026-03-19 16:00:00', '2026-03-29 19:00:00', 'EN_ATTENTE', 90, 1, NULL, NULL),
(20, 'Election de teEt listes', 'pour tester la liste ', '2026-03-24 23:55:00', '2026-03-25 01:15:00', 'TERMINEE', 25, 4, 7, 60),
(32, 'Monstral Election', 'GDGDJD', '2026-03-28 14:00:00', '2026-03-28 15:00:00', 'EN_ATTENTE', 89, 1, 0, 1440),
(34, 'Election jury', 'DGHJKLLXHYUI', '2026-03-29 18:00:00', '2026-03-29 21:00:00', 'APPROUVEE', 91, 1, NULL, NULL),
(35, 'Election jury', 'DGHJKLLXHYUI', '2026-03-29 18:00:00', '2026-03-29 21:00:00', 'APPROUVEE', 92, 1, NULL, NULL),
(36, 'Election jury', 'DGHJKLLXHYUI', '2026-03-29 20:00:00', '2026-03-29 23:00:00', 'EN_ATTENTE', 92, 1, 0, 1440);

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
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `liste`
--

INSERT INTO `liste` (`id_liste`, `nom`, `election_id`) VALUES
(1, 'Liste A', 8),
(2, 'Liste rouge', 8),
(3, 'Liste violet', 13),
(4, 'Liste jaune', 13),
(5, 'Liste Marron', 13),
(6, 'Liste Rouge', 19),
(7, 'Liste Verte', 19),
(8, 'Liste Orange', 19),
(9, 'Liste Rouge', 20),
(10, 'Liste Verte', 20),
(11, 'Liste Orange', 20);

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
) ENGINE=MyISAM AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(18, 'LISTE', NULL, 20),
(12, 'UNINOMINAL', NULL, 14),
(13, 'UNINOMINAL', NULL, 15),
(14, 'UNINOMINAL', NULL, 16),
(15, 'UNINOMINAL', NULL, 17),
(19, 'UNINOMINAL', NULL, 21),
(17, 'LISTE', NULL, 19),
(20, 'BINOMINAL', NULL, 22),
(21, 'UNINOMINAL', NULL, 23),
(22, 'UNINOMINAL', NULL, 24),
(23, 'UNINOMINAL', NULL, 25),
(24, 'UNINOMINAL', NULL, 26),
(25, 'BINOMINAL', NULL, 27),
(26, 'UNINOMINAL', NULL, 28),
(27, 'UNINOMINAL', NULL, 29),
(28, 'BINOMINAL', NULL, 30),
(29, 'UNINOMINAL', NULL, 31),
(30, 'UNINOMINAL', NULL, 32),
(32, 'BINOMINAL', NULL, 34),
(33, 'BINOMINAL', NULL, 35),
(34, 'BINOMINAL', NULL, 36);

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
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `siege_liste`
--

INSERT INTO `siege_liste` (`id_siege`, `election_id`, `liste_id`, `nb_sieges`) VALUES
(1, 20, 11, 3),
(2, 20, 9, 4);

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
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `tour_election`
--

INSERT INTO `tour_election` (`id_tour`, `election_id`, `numero_tour`, `statut`, `gagnant_id`, `date_debut`, `date_fin`, `date_fin_tour`) VALUES
(1, 8, 1, 'EN_COURS', NULL, '2026-03-15 12:53:20', NULL, NULL),
(4, 20, 1, 'TERMINE', NULL, '2026-03-24 16:11:04', '2026-03-24 23:05:24', '2026-03-24 17:10:00'),
(3, 19, 1, 'EN_COURS', NULL, '2026-03-24 13:10:32', NULL, '2026-03-24 14:10:00'),
(5, 20, 2, 'TERMINE', NULL, '2026-03-24 23:05:24', '2026-03-24 23:11:17', '2026-03-25 01:05:00'),
(6, 20, 3, 'TERMINE', NULL, '2026-03-24 23:11:17', '2026-03-24 23:15:02', '2026-03-25 01:11:00'),
(7, 20, 4, 'GAGNANT_TROUVE', 11, '2026-03-24 23:15:02', '2026-03-24 23:19:22', '2026-03-25 01:15:00');

-- --------------------------------------------------------

--
-- Structure de la table `transaction_paiement`
--

DROP TABLE IF EXISTS `transaction_paiement`;
CREATE TABLE IF NOT EXISTS `transaction_paiement` (
  `id_transaction` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `campay_reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `external_reference` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `montant` int NOT NULL DEFAULT '500',
  `statut` enum('PENDING','SUCCESSFUL','FAILED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `donnees_election` longtext COLLATE utf8mb4_unicode_ci,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_confirmation` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_transaction`),
  UNIQUE KEY `campay_reference` (`campay_reference`),
  KEY `admin_id` (`admin_id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `transaction_paiement`
--

INSERT INTO `transaction_paiement` (`id_transaction`, `admin_id`, `campay_reference`, `external_reference`, `montant`, `statut`, `donnees_election`, `date_creation`, `date_confirmation`) VALUES
(1, 88, 'a0ecd3b0-ddee-4cae-8d8a-220054708c84', 'ELECTION-88-1774697683558', 25, 'PENDING', '{\"titre\":\"MONTE ELECTION\",\"description\":\"AZERTYU\",\"type\":\"BINOMINAL\",\"startDate\":\"2026-03-28 13:00:00\",\"endDate\":\"2026-03-28 14:00:00\",\"dureeTourMinutes\":null,\"nbSieges\":null}', '2026-03-28 11:34:44', NULL),
(2, 89, 'f951042d-6f7b-4fda-bf97-3d791e9378b7', 'ELECTION-89-1774698972117', 25, 'SUCCESSFUL', '{\"titre\":\"Monstral Election\",\"description\":\"GDGDJD\",\"type\":\"UNINOMINAL\",\"startDate\":\"2026-03-28 14:00:00\",\"endDate\":\"2026-03-28 15:00:00\",\"dureeTourMinutes\":null,\"nbSieges\":null}', '2026-03-28 11:56:12', '2026-03-28 11:56:36'),
(3, 90, '510f7d18-8336-4a33-96c7-56b7826157a6', 'ELECTION-90-1774797694669', 25, 'PENDING', '{\"titre\":\"ELECTION DU PRESIDENT\",\"description\":\"ERTYUIODKJHGHJKL \",\"type\":\"UNINOMINAL\",\"startDate\":\"2026-03-19 17:00:00\",\"endDate\":\"2026-03-29 21:00:00\",\"dureeTourMinutes\":null,\"nbSieges\":null}', '2026-03-29 15:21:35', NULL),
(4, 91, '9e314f3e-389b-484a-9241-75d10169dc6d', 'ELECTION-91-1774801844204', 25, 'PENDING', '{\"titre\":\"Election jury\",\"description\":\"DGHJKLLXHYUI\",\"type\":\"BINOMINAL\",\"startDate\":\"2026-03-29 20:00:00\",\"endDate\":\"2026-03-29 23:00:00\",\"dureeTourMinutes\":null,\"nbSieges\":null}', '2026-03-29 16:30:44', NULL),
(5, 92, 'f847a721-0e8e-4c5d-83a3-06395f44e907', 'ELECTION-92-1774802150724', 25, 'SUCCESSFUL', '{\"titre\":\"Election jury\",\"description\":\"DGHJKLLXHYUI\",\"type\":\"BINOMINAL\",\"startDate\":\"2026-03-29 20:00:00\",\"endDate\":\"2026-03-29 23:00:00\",\"dureeTourMinutes\":null,\"nbSieges\":null}', '2026-03-29 16:35:51', '2026-03-29 16:36:22');

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
) ENGINE=MyISAM AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `nom`, `prenom`, `email`, `mot_de_passe`, `role`, `actif`, `date_creation`) VALUES
(49, 'akashi', 'akash', 'akashi@gmail.com', '$2b$10$u4SPkBe0hCyY266C9ri7V.qeAEmaFy/y.sIn6dd9cP4QxZ2MaJZ4i', 'ELECTEUR', 1, '2026-03-23 21:37:44'),
(17, 'saley', 'ali', 'ali@gmail.com', '$2b$10$K3YiUjiRWYTGZ1mlhKFQ8.IDIK/llpBR5WW8IZq5z3n2XhYCrfuSC', 'ELECTEUR', 1, '2026-02-17 02:18:52'),
(19, 'eva', 'priso', 'prisoEva@gmail.com', '$2b$10$OMKDfL9I49igYaypQYUr3ug2DWg5mwliuvBG5x64eTSez//D2n4A.', 'ADMIN_ELECTION', 1, '2026-02-20 11:02:11'),
(20, 'don', 'kou', 'don@gmail.com', 'don098', 'ADMIN_ELECTION', 1, '2026-02-21 14:09:41'),
(48, 'Takao', 'midorima', 'takao@gmail.com', '$2b$10$RHViHFf5mYaeAwYdc0HvQ.CXYUqPfSdun5/1dGSw9mjtwliWTFu2a', 'ELECTEUR', 1, '2026-03-23 21:37:00'),
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
(67, 'Martin', 'Sophie', 'sophie@gmail.com', '$2b$10$muMEDeG/rndSbyC1pOa9vu3e9AumsZ23jdbOpp8XONmNHdRZxgOGy', 'ELECTEUR', 1, '2026-03-24 15:42:24'),
(51, 'kise', 'dort', 'kise@gmail.com', '$2b$10$ZNosScKKN4rzTB.48f18sucnVM4GyykP19wkNRYDFKzRur7CQQCZC', 'ELECTEUR', 1, '2026-03-23 21:39:07'),
(77, 'ibrahim', 'mouh', 'ib@gmail.com', '$2b$10$ZDZSRtHCFerYiIdvAKRVkuQzUvK7mFY7yORzTc60tb2EfA6LRhkY2', 'ELECTEUR', 1, '2026-03-24 16:38:21'),
(78, 'mouhamedu', 'ib', 'mhd@gmail.com', '$2b$10$.jN0aPMO3FVKc1EaHL.AIugF6n1BqOCgCTqeAX.1Fk5TTE0yGpsB2', 'ELECTEUR', 1, '2026-03-24 16:39:50'),
(79, 'ahmet', 'urrr', 'ah@gmail.com', '$2b$10$KUAIHovPoZ94WNdmSqJ7r.XkTXzFfsjWMi4adOcc6DzODrUPRj7VO', 'ELECTEUR', 1, '2026-03-24 16:40:25'),
(76, 'marcher', 'gare', 'marcher@gmail.com', '$2b$10$jWMKst3GrHn8ERhWFJArWecRp4ImU3yFoAHfBLLLUBMvsNoh.FkT2', 'ELECTEUR', 1, '2026-03-24 15:42:50'),
(73, 'kalicha', 'soumaya', 'soumaya@gmail.com', '$2b$10$IXfEtacaV0HWnYlFPbLVNuWHmeOvu6cLVo1jD8zPbCNfUcmZqDYqu', 'ELECTEUR', 1, '2026-03-24 15:42:41'),
(74, 'luve', 'lucj', 'luve@gmail.com', '$2b$10$HgXh13BfP43TV0b9IxYQVurvhDzhJjxk7yo3AoLTo8NuCFgbZDL3K', 'ELECTEUR', 1, '2026-03-24 15:42:46'),
(75, 'dipende', 'atttt', 'dipense@gmail.com', '$2b$10$wtk..FX0KQD0RkSmnaD4huf7uqKKmZ/U2P/3AaYGY/nZNCWOReOia', 'ELECTEUR', 1, '2026-03-24 15:42:47'),
(71, 'qatar', 'derut', 'qatar@gmail.com', '$2b$10$xShn.TKi21UzTszp0LEQpurnDf/PYeLiYdWYsxvCZnRis1yZ4SBrm', 'ELECTEUR', 1, '2026-03-24 15:42:40'),
(72, 'niger', 'niamey', 'niger@gmail.com', '$2b$10$.ISVUWP2YfIRFfQDVF.VpO5w46L8/54fF5hMx7fIqOyh2g5kLNSAa', 'ELECTEUR', 1, '2026-03-24 15:42:41'),
(70, 'voisine', 'after', 'voisine@gmail.com', '$2b$10$evqA/qFdzp1H4ijaPsQdReVmqsMu68uGM4/22rekUPxG0vWcbEbpu', 'ELECTEUR', 1, '2026-03-24 15:42:38'),
(69, 'nouka', 'atrer', 'nouka@gmail.com', '$2b$10$bhAJ3qiXsCm2eUj3uS7pz.fsnKsWz.IO2sT3i.FlwQwlFGjRqvTW2', 'ELECTEUR', 1, '2026-03-24 15:42:38'),
(68, 'Tagne', 'Arthur', 'tagne@gmail.com', '$2b$10$gvUe.6HX882e5YxG031V7.ZnTsg8MxvRFlOmym1FTXdE8TK/uUYtG', 'ELECTEUR', 1, '2026-03-24 15:42:36'),
(66, 'Dupont', 'Jean', 'jean@gmail.com', '$2b$10$ynHZtoDk7ReUhx2NRFohKeFYdcnDCmEVm4gqAFfopL6j3T5VxQacm', 'ELECTEUR', 1, '2026-03-24 15:42:20'),
(80, 'teddy', 'ponter', 'teddy@gmail.com', '$2b$10$xithPjv99SoAkl5PUurpAuLFBDEfmqP4TgGDld98FdrLukYRdw4o.', 'ELECTEUR', 1, '2026-03-26 11:37:22'),
(81, 'sansit', 'ben', 'moussaouhoumoudou34@gmail.com', '$2b$10$.t./rGmJFPX9z.T3k2yhbe2lta6GghHE9A757CiR2hO.Vzf6T2npu', 'ADMIN_ELECTION_PENDING', 0, '2026-03-26 21:56:17'),
(82, 'azerty', 'qwerty', 'azerty@gmail.com', '$2b$10$R0rGIP7t52vdHP/Aq1JjxuS6.uPft/isQyy8g.0syyuXQALflKHgO', 'ADMIN_ELECTION_PENDING', 1, '2026-03-28 08:37:54'),
(83, 'azerty', 'qwerty', 'azert@mail.com', '$2b$10$HW/lGgtqYTwlze6Nq2M.gOph0bbs5uKpRIPjMk0.efHXyMdj8WaFi', 'ADMIN_ELECTION_PENDING', 1, '2026-03-28 10:14:44'),
(84, 'ouhoumoud', 'Moussa ', 'ouhmoudmoussa8@gmail.com', '$2b$10$nVuRSgRmjiNyEeJJyZeBwuzyxHKarYxFar.Mna2TmjDSLS4c327He', 'SUPER_ADMIN', 1, '2026-03-28 10:27:56'),
(85, 'pam', 'pam', 'pam@mail.com', '$2b$10$DE3FHmth/GOo/Q1H29abs.KQ/r5lw.vJAM2NYACIsnhYf3XK32GyO', 'ADMIN_ELECTION_PENDING', 1, '2026-03-28 11:09:15'),
(86, 'BIBOUM', 'biboum', 'biboum@mail.com', '$2b$10$jx33rr7Td2yE7fSle2Ktn.cSxqvrsB0BSSHv4ScdNqivKgK3zv/BO', 'ADMIN_ELECTION_PENDING', 1, '2026-03-28 11:20:06'),
(87, 'piste', 'biboum', 'piste@mail.com', '$2b$10$cEtzPmef5w8vTpxJRAJGmOjLBnkftsYeG0.X1E6qX9EVMU3lW6qTq', 'ADMIN_ELECTION_PENDING', 1, '2026-03-28 11:26:53'),
(88, 'piste', 'biboum', 'monte@mail.com', '$2b$10$zYEBsM8/h8im55MYuqmUo.FWpUtLn.oLUzT6pMCgDMhXdePVk7V.S', 'ADMIN_ELECTION_PENDING', 1, '2026-03-28 11:34:40'),
(89, 'matar', 'siradji', 'matar@gmail.com', '$2b$10$.Jj3abhIZvuZYp88CFKVGeuzS8r9CAzuLthPA69i3juZFQ0hgsvca', 'ADMIN_ELECTION', 1, '2026-03-28 11:56:09'),
(90, 'Moussale', 'azeer', 'moussale@gmail.com', '$2b$10$PT6JYYAhPV.kxYYDcxhzU.62Z0kAvK8/fZPz3r1bS2z6Zab1GVEo6', 'ADMIN_ELECTION_PENDING', 1, '2026-03-29 15:21:31'),
(91, 'ponto', 'pert', 'ponto@gmail.com', '$2b$10$eP5YBcZgv/3otNxHefC51eUDLj9Jc/rzMJKm69VStngWFON.NU2uG', 'ADMIN_ELECTION', 1, '2026-03-29 16:30:41'),
(92, 'ponto', 'pert', 'pontoU@gmail.com', '$2b$10$egR4cT2ue.VaYuGac3sMaubTqBSynkVIMjVqJMuarBUr/sqFicCCq', 'ADMIN_ELECTION', 1, '2026-03-29 16:35:48');

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
) ENGINE=MyISAM AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vote`
--

INSERT INTO `vote` (`id_vote`, `date_vote`, `electeur_id`, `candidat_id`, `election_id`, `candidat2_id`) VALUES
(1, '2026-03-12 12:58:07', 39, 6, 11, NULL),
(2, '2026-03-15 13:20:52', 35, 8, 7, NULL),
(3, '2026-03-24 16:46:27', 78, 79, 21, NULL),
(4, '2026-03-24 16:46:48', 79, 79, 21, NULL),
(5, '2026-03-24 16:47:27', 77, 80, 21, NULL),
(6, '2026-03-26 12:12:52', 80, 34, 17, NULL),
(7, '2026-03-26 12:13:41', 48, 35, 17, NULL),
(8, '2026-03-26 12:14:28', 51, 36, 17, NULL),
(9, '2026-03-26 12:14:52', 49, 36, 17, NULL);

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
) ENGINE=MyISAM AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vote_tour`
--

INSERT INTO `vote_tour` (`id_vote_tour`, `election_id`, `electeur_id`, `liste_id`, `tour`, `date_vote`) VALUES
(1, 20, 66, 9, 1, '2026-03-24 22:56:40'),
(2, 20, 75, 11, 1, '2026-03-24 22:58:38'),
(3, 20, 74, 10, 1, '2026-03-24 22:59:06'),
(4, 20, 76, 11, 1, '2026-03-24 22:59:53'),
(5, 20, 72, 9, 1, '2026-03-24 23:00:16'),
(6, 20, 69, 10, 1, '2026-03-24 23:01:23'),
(7, 20, 71, 11, 1, '2026-03-24 23:02:51'),
(8, 20, 67, 9, 1, '2026-03-24 23:03:17'),
(9, 20, 73, 10, 1, '2026-03-24 23:03:39'),
(10, 20, 68, 11, 1, '2026-03-24 23:04:03'),
(11, 20, 75, 11, 2, '2026-03-24 23:07:05'),
(12, 20, 66, 11, 2, '2026-03-24 23:07:30'),
(13, 20, 74, 9, 2, '2026-03-24 23:07:55'),
(14, 20, 76, 9, 2, '2026-03-24 23:08:17'),
(15, 20, 72, 10, 2, '2026-03-24 23:08:37'),
(16, 20, 69, 9, 2, '2026-03-24 23:08:58'),
(17, 20, 71, 11, 2, '2026-03-24 23:09:27'),
(18, 20, 67, 11, 2, '2026-03-24 23:09:52'),
(19, 20, 73, 9, 2, '2026-03-24 23:10:13'),
(20, 20, 68, 10, 2, '2026-03-24 23:10:35'),
(21, 20, 75, 11, 3, '2026-03-24 23:11:47'),
(22, 20, 66, 11, 3, '2026-03-24 23:12:09'),
(23, 20, 74, 11, 3, '2026-03-24 23:12:28'),
(24, 20, 76, 9, 3, '2026-03-24 23:12:47'),
(25, 20, 72, 9, 3, '2026-03-24 23:13:06'),
(26, 20, 69, 9, 3, '2026-03-24 23:13:24'),
(27, 20, 71, 9, 3, '2026-03-24 23:13:42'),
(28, 20, 67, 10, 3, '2026-03-24 23:14:05'),
(29, 20, 73, 11, 3, '2026-03-24 23:14:28'),
(30, 20, 75, 11, 4, '2026-03-24 23:15:32'),
(31, 20, 66, 11, 4, '2026-03-24 23:15:52'),
(32, 20, 74, 11, 4, '2026-03-24 23:16:13'),
(33, 20, 76, 11, 4, '2026-03-24 23:16:34'),
(34, 20, 72, 9, 4, '2026-03-24 23:16:55'),
(35, 20, 69, 9, 4, '2026-03-24 23:17:17'),
(36, 20, 71, 11, 4, '2026-03-24 23:17:39'),
(37, 20, 67, 11, 4, '2026-03-24 23:17:58'),
(38, 20, 73, 11, 4, '2026-03-24 23:18:19'),
(39, 20, 68, 11, 4, '2026-03-24 23:19:00');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
