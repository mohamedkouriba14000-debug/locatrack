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

### Structure des Fichiers
```
/app/
├── backend/
│   ├── server.py          # Monolithe (à refactorer)
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

## Completed Work (Session 09/01/2026)

### Module Chat - CORRIGÉ
- Correction du filtrage multi-tenant sur `/api/messages/users`
- Locateurs voient uniquement leurs employés
- Employés voient leur locateur et collègues
- Polling toutes les 3 secondes pour les nouveaux messages
- Interface WhatsApp-style fonctionnelle

### Module Paiements - CORRIGÉ
- Ajout endpoint PUT `/api/payments/{id}` pour modification
- Ajout endpoint DELETE `/api/payments/{id}` pour suppression
- Interface avec boutons éditer/supprimer sur chaque carte
- Total encaissé calculé automatiquement

### Tests
- 15 tests automatisés passés (100% success)
- Tests couvrant : Auth, Chat CRUD, Payments CRUD, Multi-tenant isolation
- Fichier de tests : `/app/tests/test_chat_payments.py`

## Prioritized Backlog

### P0 - Critique (Terminé)
- [x] ~~Module Chat non fonctionnel~~
- [x] ~~Module Paiements incomplet (manque edit/delete)~~

### P1 - Haute Priorité
- [ ] Finaliser ContractPrintPage (signatures canvas)
- [ ] Notifications Push (backend + frontend)
- [ ] Refactoring server.py en modules

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
