# Matcha - TODO / Checklist

## Legende
- [x] Fait
- [ ] A faire
- [~] Partiellement fait

---

## I. Instructions Generales

### Contraintes Techniques
- [x] Micro-framework (Express - autorise)
- [x] Base de donnees relationnelle (PostgreSQL)
- [x] Pas d'ORM (requetes SQL brutes avec pg driver)
- [x] Compatible Firefox et Chrome (derniere version)
- [x] Layout: header, main, footer
- [x] Design responsive / mobile-friendly
- [x] Validation de tous les formulaires
- [x] Dockerise (docker-compose)

### Securite (OBLIGATOIRE - echec = 0)
- [x] Mots de passe hashes (bcrypt, 10 salt rounds)
- [x] Protection injection SQL (requetes parametrees)
- [x] Prevention XSS (React auto-escape, pas de dangerouslySetInnerHTML)
- [x] Validation upload fichiers (type + taille)
- [x] Credentials dans .env, exclu de Git

### Base de donnees
- [x] 500+ profils distincts (seed.js avec faker)
- [x] Schema complet (users, tags, user_tags, user_images, likes, profile_views, blocks, reports, notifications, messages)

---

## II. Partie Obligatoire

### IV.1 - Registration et Connexion

#### Inscription
- [x] Email
- [x] Username
- [x] Nom de famille
- [x] Prenom
- [x] Mot de passe securise (pas de mots communs, complexite validee avec zxcvbn)
- [x] Validation formulaire (client + serveur)

#### Verification Email
- [x] Email envoye apres inscription
- [x] Lien unique de verification (token crypto)
- [x] Compte non utilisable avant verification

#### Connexion
- [x] Login avec username + password
- [x] Generation token JWT
- [x] Option "Se souvenir de moi" (30 jours vs 1 heure)

#### Mot de passe oublie
- [x] Demande de reset par email
- [x] Email avec lien de reinitialisation (token 1h)
- [x] Page de reset password

#### Deconnexion
- [x] Logout en un clic depuis n'importe quelle page
- [x] Suppression token localStorage

---

### IV.2 - Profil Utilisateur

#### Informations obligatoires
- [x] Genre (male/female)
- [x] Preferences sexuelles (heterosexual/homosexual/bisexual)
- [x] Biographie (max 500 caracteres)
- [x] Liste d'interets avec tags reutilisables (#vegan, #geek, etc.)
- [x] Jusqu'a 5 photos, dont 1 photo de profil

#### Modifications
- [x] Modifier toutes les infos a tout moment
- [x] Modifier nom, prenom, email
- [x] Gestion des photos (upload, supprimer, definir profil)
- [x] Gestion des tags

#### Historique et interactions
- [x] Voir qui a consulte son profil (GET /api/views)
- [x] Voir qui a "like" son profil (GET /api/likes/received)

#### Fame Rating
- [x] Score public de popularite
- [x] Calcul dynamique (likes +5, vues +1, photos +2, profil complet +10)
- [x] Mis a jour automatiquement

#### Localisation GPS
- [x] Stockage latitude/longitude
- [x] Entree manuelle de la position
- [x] Modification dans le profil
- [ ] Geolocalisation automatique via navigateur (optionnel, consent explicite)

---

### IV.3 - Browsing (Navigation)

#### Suggestions intelligentes
- [x] Endpoint GET /api/browsing/recommendations
- [x] Filtrage par preferences sexuelles (smart matching)
- [x] Bisexuel par defaut si non specifie
- [x] Proximite geographique (formule Haversine)
- [x] Tags en commun
- [x] Fame rating
- [x] Exclut les utilisateurs bloques
- [x] Exclut les matchs existants

#### Tri
- [x] Par age
- [x] Par localisation/distance
- [x] Par fame rating
- [x] Par tags en commun
- [x] Ordre croissant/decroissant

#### Filtres
- [x] Tranche d'age (minAge, maxAge)
- [x] Tranche de fame (minFame, maxFame)
- [x] Distance max (maxDistance en km)
- [x] Tags specifiques
- [x] Pagination (limit, offset)

---

### IV.4 - Recherche Avancee

- [x] Endpoint GET /api/browsing/search
- [x] Filtre par genre
- [x] Tranche d'age
- [x] Tranche de fame rating
- [x] Localisation/distance
- [x] Un ou plusieurs tags d'interet
- [x] Resultats triables (age, distance, fame, tags)
- [x] Resultats filtrables
- [x] UI avec sliders et multi-select (FilterSidebar)

---

### IV.5 - Vue Profil

#### Affichage
- [x] Afficher tous les details sauf email/password
- [x] Afficher photos, bio, tags, age, genre
- [x] Afficher fame rating
- [x] Afficher statut en ligne ou derniere connexion

#### Historique des visites
- [x] Enregistrer la visite dans l'historique (POST /api/views/:userId)
- [x] Tracker viewer_id, viewed_id, viewed_at

#### Like / Unlike
- [x] "Liker" la photo de profil d'un autre utilisateur
- [x] Two-way like = "connectes" (peuvent chatter)
- [x] Ne peut pas liker sans photo de profil
- [x] Retirer un like precedemment donne
- [x] Desactiver notifs et chat apres unlike

#### Statut de connexion
- [x] Voir clairement si l'autre nous a like
- [x] Voir si on est deja connectes (match)
- [x] Option de unlike / deconnecter

#### Report
- [x] Signaler un compte comme "fake account"
- [x] Endpoint POST /api/reports/:userId avec raison

#### Block
- [x] Bloquer un utilisateur
- [x] Utilisateur bloque n'apparait plus dans recherches
- [x] Plus de notifications de l'utilisateur bloque
- [x] Plus de chat possible

---

### IV.6 - Chat

- [x] Chat temps reel entre utilisateurs connectes (Socket.io)
- [x] Delai max 10 secondes (respecte)
- [x] Voir nouveau message depuis n'importe quelle page
- [x] Historique des messages (GET /api/chat/messages/:userId)
- [x] Liste des conversations (GET /api/chat/conversations)
- [x] Indicateur messages non lus
- [x] Marquer comme lu (POST /api/chat/mark-read/:userId)
- [x] Indicateurs de frappe (typing-start/typing-stop)
- [x] Stockage messages en BDD

---

### IV.7 - Notifications

#### Types de notifications temps reel
- [x] Reception d'un "like"
- [x] Profil consulte
- [x] Reception d'un message
- [x] Like mutuel (match)
- [x] Unlike d'un utilisateur connecte

#### Implementation
- [x] Delai max 10 secondes (Socket.io)
- [x] Visible depuis n'importe quelle page (NotificationBell)
- [x] Indicateur notifications non lues
- [x] Stockage en BDD (table notifications)
- [x] Toast notifications (react-hot-toast)

---

## III. Partie Bonus

> Note: Les bonus ne sont evalues que si la partie obligatoire est PARFAITE.

- [ ] OmniAuth (OAuth strategies - Google, 42, etc.)
- [ ] Galerie photo avec drag-and-drop et edition (crop, rotate, filtres)
- [ ] Carte interactive des utilisateurs avec GPS precis via JavaScript
- [ ] Chat video/audio pour utilisateurs connectes
- [ ] Planification de dates/evenements reels

---

## IV. A Verifier / Ameliorer

### Potentielles ameliorations
- [ ] Geolocalisation automatique via API navigateur (Geolocation API)
- [ ] Recherche par nom de ville (geocoding)
- [ ] Dashboard admin pour moderer les reports
- [ ] Tests unitaires et d'integration
- [ ] Logs structure (winston ou similar)

### Verification avant defense
- [ ] Tester tous les parcours utilisateur
- [ ] Verifier 0 erreurs/warnings console (client + serveur)
- [ ] Verifier 500+ profils en BDD
- [ ] Tester sur Firefox ET Chrome
- [ ] Tester le responsive mobile
- [ ] Verifier securite (injection SQL, XSS, upload)

---

## V. Resume

| Section | Statut | Progression |
|---------|--------|-------------|
| Instructions Generales | OK | 100% |
| Securite | OK | 100% |
| Registration/Login | OK | 100% |
| Profil Utilisateur | OK | 95% (GPS auto optionnel) |
| Browsing | OK | 100% |
| Recherche | OK | 100% |
| Vue Profil | OK | 100% |
| Chat | OK | 100% |
| Notifications | OK | 100% |
| **MANDATORY TOTAL** | **OK** | **~99%** |
| Bonus | Non commence | 0% |

---

**Verdict**: Le projet est pret pour l'evaluation de la partie obligatoire. Tous les criteres du sujet sont implementes. Il reste a effectuer des tests finaux et verifier l'absence d'erreurs avant la soutenance.
