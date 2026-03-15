# 🗳️ Application de Vote en Ligne

## 📌 Description

Cette application est une plateforme de **gestion d’élections en ligne** permettant d’organiser différents types de scrutins de manière sécurisée et transparente.

Elle permet :
- aux **électeurs** de voter en ligne
- aux **administrateurs d’élection** de gérer les scrutins
- au **super administrateur** de superviser l’ensemble du système

L’objectif est de **digitaliser les processus électoraux**, réduire les fraudes et permettre une **gestion centralisée des votes**.

---

# 🚀 Fonctionnalités Principales

## 👤 Électeur
- Création de compte / authentification
- Consultation des élections disponibles
- Participation aux élections
- Vote sécurisé
- Un seul vote par élection
- Consultation des résultats (si autorisé)

---

## 🛠️ Admin d'Élection
- Création d'une élection
- Définition du type de scrutin
- Ajout des candidats
- Gestion des électeurs
- Ouverture et fermeture du scrutin
- Consultation des résultats
- Tableau de bord de suivi

---

## 👑 Super Admin
- Gestion des administrateurs d’élection
- Gestion globale du système
- Supervision de toutes les élections
- Gestion des utilisateurs
- Accès aux statistiques globales

---

# 🗳️ Types de Scrutin Supportés

## 1️⃣ Scrutin Uninominal
Dans ce type de scrutin, chaque électeur vote pour **un seul candidat**.

Le candidat ayant obtenu **le plus grand nombre de voix** est déclaré vainqueur.

Exemple :
- Élection présidentielle
- Élection d’un représentant

---

## 2️⃣ Scrutin Binominal
Dans ce système, les candidats se présentent **par paire (binôme)**.

Chaque électeur vote pour **un binôme**.

Le binôme ayant obtenu **le plus grand nombre de voix** remporte l’élection.

Exemple :
- Élection de deux représentants associés
- Président et vice-président

---

## 3️⃣ Scrutin de Liste
Les électeurs votent pour **une liste de candidats**.

La liste qui obtient **la majorité des voix** est déclarée gagnante.

Ce type de scrutin est souvent utilisé pour :
- élections municipales
- élections parlementaires

---

# 🧱 Architecture du Projet

app-vote
│
├── backend-vote
│ ├── controllers
  ├── config
      └── db.sql
      └── .env
│ ├── routes
│ 
│ ├── middlewares
│ ├── services
      └── mailer.js
│ └── server.js
│
├── frontend-vote
│ ├── src
│ │ ├── pages
│ │ ├── components
│ │ ├── services
│ │ ├── context
│ │ └── App.jsx
│
└── 

---

# ⚙️ Technologies Utilisées

## Frontend
- React.js
- Vite
- React Router
- Chart.js

## Backend
- Node.js
- Express.js
- Socket.io (mise à jour des résultats en temps réel)

## Base de Données
- MySQL

## Outils
- Git
- GitHub
- Postman

---

# 🗄️ Structure Simplifiée de la Base de Données

Tables principales :

- `utilisateurs`
- `electeurs`
- `admins`
- `elections`
- `candidats`
- `votes`
- `resultats`

Contraintes importantes :
- un électeur ne peut **voter qu'une seule fois par élection**
- chaque élection possède **un type de scrutin**

---

# 📊 Résultats en Temps Réel

L’application utilise **Socket.io** pour mettre à jour automatiquement les résultats sur le tableau de bord des administrateurs sans recharger la page.

---

# 🛠️ Installation du Projet

## 1️⃣ Cloner le projet

```bash
git clone https://github.com/votre-utilisateur/app-vote.git
cd app-vote

2️⃣ Installer les dépendances Backend
cd backend-vote
npm install
3️⃣ Installer les dépendances Frontend
cd frontend-vote
npm install
▶️ Lancer l'application
Backend
node server.js
Frontend
npm run dev
🌐 Accès à l'application
Frontend :
http://localhost:5173
Backend API :
http://localhost:5000

🔐 Sécurité
Authentification des utilisateurs
Gestion des rôles (Super Admin / Admin / Électeur)
Protection contre les votes multiples
Validation des données
Contrôle d'accès aux ressources

📦 Déploiement
L'application peut être déployée gratuitement sur :
Frontend
Vercel
Netlify
Backend
Render
Railway
Base de données
Railway
PlanetScale
Clever Cloud
👨‍💻 Auteur
Développé par :
Moussa Ouhoumoud
📌 Améliorations Futures
Authentification par email
Vérification OTP
Vote crypté
Audit des élections
Export des résultats (PDF / Excel)

