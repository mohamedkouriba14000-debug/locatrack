# LocaTrack - PRD (Product Requirements Document)

## Original Problem Statement
Plateforme SaaS multi-tenant de gestion de location de véhicules pour l'Algérie avec les fonctionnalités suivantes :
- **Modèle SaaS** : 3 rôles (superadmin, locateur, employee)
- **Modules principaux** : Flotte, Clients, Contrats, Réservations, Paiements, Maintenance, Infractions
- **Fonctionnalités clés** : GPS en temps réel, Messagerie interne, Notifications push
- **UI** : Thème moderne avec support Arabe/Français

## User Personas
1. **SuperAdmin** - Propriétaire de la plateforme
2. **Locateur** - Propriétaire d'une entreprise de location (tenant)
3. **Employé** - Personnel travaillant pour un locateur

## Core Requirements

### Authentication & Multi-Tenancy
- [x] Inscription publique pour locateurs avec essai 15 jours
- [x] Gestion des abonnements (trial, annual, lifetime)
- [x] Isolation complète des données entre tenants
- [x] RBAC (Role-Based Access Control)

### Modules Implémentés
- [x] Dashboard SuperAdmin (stats plateforme, gestion utilisateurs)
- [x] Dashboard Locateur (KPIs, actions rapides)
- [x] Gestion de Flotte (CRUD véhicules, IMEI GPS, contrôle technique)
- [x] Gestion des Clients (CRUD, upload permis)
- [x] Gestion des Employés (CRUD)
- [x] Gestion des Contrats (CRUD, signature numérique, impression)
- [x] Gestion des Réservations
- [x] **Gestion des Paiements** (CRUD complet - 09/01/2026)
- [x] **Messagerie Interne** (Chat multi-tenant - 09/01/2026)
- [x] Suivi GPS en temps réel (API tracking.gps-14.net)
- [x] Page Paramètres (configuration API GPS)

### Fonctionnalités Restantes
- [ ] Notifications Push (icône ajoutée, logique backend manquante)
- [ ] Page Contrat Imprimable (signatures numériques à finaliser)
- [ ] Gestion de la Maintenance
- [ ] Gestion des Infractions

## Architecture Technique

### Stack
- **Backend** : FastAPI, Pydantic, Motor (MongoDB async), JWT
- **Frontend** : React, TailwindCSS, Shadcn UI, Lucide Icons
- **Database** : MongoDB
- **Intégrations** : GPS API (tracking.gps-14.net)

### Structure des Fichiers (Refactoré 09/01/2026)
```
/app/
├── backend/
│   ├── server.py          # Main entry point (~90 lignes)
│   ├── config.py          # Database, settings (~35 lignes)
│   ├── models/
│   │   └── __init__.py    # Pydantic models (~310 lignes)
│   ├── utils/
│   │   ├── __init__.py
│   │   └── auth.py        # Auth helpers (~65 lignes)
│   ├── routers/           # API routes (total ~1800 lignes)
│   │   ├── auth.py
│   │   ├── employees.py
│   │   ├── settings.py
│   │   ├── vehicles.py
│   │   ├── clients.py
│   │   ├── contracts.py
│   │   ├── reservations.py
│   │   ├── payments.py
│   │   ├── maintenance.py
│   │   ├── infractions.py
│   │   ├── reports.py
│   │   ├── superadmin.py
│   │   ├── gps.py
│   │   ├── notifications.py
│   │   └── messages.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/         # Pages principales
│   │   ├── components/    # Composants réutilisables
│   │   └── contexts/      # Auth, Language contexts
│   └── package.json
└── tests/
    └── test_chat_payments.py
```

## Completed Work (Session 10/01/2026)

### Bug Fix - Ajout de véhicule
- Correction du mapping des champs frontend/backend (`make` → `brand`, `registration_number` → `plate_number`)
- Formulaire de véhicule mis à jour avec les bons champs (Marque, Immatriculation, Carburant, Transmission, Kilométrage)
- Ajout de véhicule fonctionne maintenant correctement

### Changement de couleurs (jaune → bleu)
- Badges Locateur : `amber` → `blue`
- Badges Lifetime : `amber` → `indigo`
- Stats cards SuperAdmin : couleurs harmonisées
- Menu sidebar SuperAdmin : `amber` → `indigo`

### Bannière d'essai pour nouveaux inscrits
- Création du composant `TrialBanner.js`
- Affichage automatique pour les locateurs en période d'essai
- Message de bienvenue avec jours restants
- Numéro de contact : +2130555054421
- Options d'abonnement mentionnées (1 an ou illimité)

### SuperAdmin - Dernière IP de connexion
- Ajout des champs `last_ip` et `last_login` au modèle User
- Mise à jour de l'endpoint `/auth/login` pour enregistrer l'IP
- Colonne "Dernière connexion" dans le tableau SuperAdmin avec date/heure et IP

### Backend Refactoré (session précédente)
- Structure modulaire avec 15 routers distincts
- Code maintenable et extensible

## Prioritized Backlog

### P0 - Critique (Terminé)
- [x] ~~Module Chat non fonctionnel~~
- [x] ~~Module Paiements incomplet (manque edit/delete)~~

### P1 - Haute Priorité
- [ ] Finaliser ContractPrintPage (signatures canvas)
- [ ] Notifications Push (frontend integration - backend OK)
- [x] ~~Refactoring server.py en modules~~ ✅ (09/01/2026)

### P2 - Moyenne Priorité
- [ ] Chat temps réel (WebSockets)
- [ ] Module Maintenance complet
- [ ] Module Infractions

### P3 - Basse Priorité
- [ ] Intégration paiements algériens (CIB, EDAHABIA)
- [ ] Export rapports PDF
- [ ] Application mobile

## Credentials de Test
- **SuperAdmin** : superadmin@locatrack.com / superadmin123
- **Locateur Test** : testlocateur2@test.com / Test1234!
- **Employé Test** : employee1@test.com / Emp1234!

## API Endpoints Clés
- `POST /api/auth/register` - Inscription locateur
- `POST /api/auth/login` - Connexion
- `GET /api/messages/users` - Utilisateurs disponibles (chat)
- `POST /api/messages/conversations` - Créer conversation
- `POST /api/messages/send` - Envoyer message
- `GET/POST/PUT/DELETE /api/payments` - CRUD paiements
- `GET /api/gps/objects` - Objets GPS
- `GET /api/gps/locations` - Positions GPS
