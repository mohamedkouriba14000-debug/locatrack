# VehicleTrack Pro - Identifiants et Informations

## Accès à l'Application / الوصول إلى التطبيق

### URL de l'Application
**Production URL:** https://vehicletrackpro.preview.emergentagent.com

### Comptes de Test / حسابات الاختبار

#### 1. Administrateur / مدير
- **Email:** admin@vehicletrack.dz
- **Password:** admin123
- **Rôle:** Admin (Accès complet)
- **Permissions:** Gestion complète de la flotte, clients, contrats, paiements, maintenance, infractions, rapports

#### 2. Employé / موظف
- **Email:** employee@vehicletrack.dz  
- **Password:** employee123
- **Rôle:** Employee (Opérations quotidiennes)
- **Permissions:** Gestion de la flotte, clients, réservations, contrats, paiements, maintenance, infractions

#### 3. Client / عميل
- **Email:** client@vehicletrack.dz
- **Password:** client123
- **Rôle:** Client (Portail client)
- **Permissions:** Voir ses réservations, contrats, et factures

---

## Véhicules de Test / مركبات الاختبار

Trois véhicules ont été préchargés dans le système:

1. **Renault Symbol 2023**
   - Immatriculation: 16-12345-16
   - Type: Sedan
   - Tarif: 3500 DZD/jour
   - GPS: GPS001

2. **Hyundai Tucson 2024**
   - Immatriculation: 16-67890-16
   - Type: SUV
   - Tarif: 5500 DZD/jour

3. **Peugeot 301 2022**
   - Immatriculation: 16-11111-16
   - Type: Sedan
   - Tarif: 3000 DZD/jour

---

## Fonctionnalités Implémentées

### ✅ Complètement Implémentées

1. **Authentification et Autorisation**
   - Système d'authentification JWT
   - 3 rôles: Admin, Employé, Client
   - Protection des routes par rôle

2. **Tableau de Bord**
   - Statistiques en temps réel
   - KPIs: Total véhicules, disponibles, loués, clients, contrats actifs
   - Revenus sur 30 jours
   - Infractions en attente
   - Maintenance à venir

3. **Gestion de la Flotte**
   - CRUD complet des véhicules
   - Enregistrement: type, modèle, châssis, assurance, documents
   - Suivi GPS (ID dispositif)
   - Statuts: disponible, loué, maintenance, indisponible
   - Recherche et filtrage

4. **Interface Bilingue**
   - Français / Arabe
   - Support RTL pour l'arabe
   - Basculement instantané de langue
   - Polices adaptées: IBM Plex Sans / IBM Plex Sans Arabic

5. **Backend API Complet**
   - Endpoints pour tous les modules
   - Modèles MongoDB: Users, Vehicles, Clients, Contracts, Reservations, Payments, Maintenance, Infractions, Invoices
   - Rapports et analyses

### 🚧 Backend Implémenté / Frontend à Compléter

6. **Gestion des Clients**
   - Backend: Endpoints CRUD, vérification documents
   - Frontend: Page à créer

7. **Réservations**
   - Backend: Création, modification, annulation
   - Frontend: Calendrier interactif à implémenter

8. **Contrats**
   - Backend: Création, personnalisation, signature
   - Frontend: Interface de signature numérique à implémenter

9. **Paiements**
   - Backend: Enregistrement CIB/EDAHABIA + manuel
   - Frontend: Interface paiements à créer

10. **Maintenance**
    - Backend: Préventive/urgence, alertes automatiques
    - Frontend: Calendrier maintenance à implémenter

11. **Infractions**
    - Backend: Gestion infractions, association véhicules/contrats
    - Frontend: Interface à créer

12. **Rapports**
    - Backend: Rapports flotte, financiers, clients
    - Frontend: Visualisations (charts) à implémenter

### ⏳ Fonctionnalités Planifiées

- **Intégration GPS:** Iframe tracking.gps-14.net
- **Signature Numérique:** Canvas locale pour contrats
- **Facturation Électronique:** Génération factures conformes DZ
- **Alertes Automatiques:** Maintenance, paiements, expirations
- **Portail Client Complet:** Dashboard, historique, factures

---

## Architecture Technique

### Stack
- **Frontend:** React 19 + Tailwind CSS + Shadcn UI
- **Backend:** FastAPI (Python)
- **Base de données:** MongoDB
- **Authentification:** JWT

### Structure des Fichiers

```
/app/
├── backend/
│   ├── server.py          # API FastAPI
│   ├── .env               # Variables d'environnement
│   └── requirements.txt   # Dépendances Python
│
└── frontend/
    ├── src/
    │   ├── contexts/      # Context API (Auth, Language)
    │   ├── components/    # Composants réutilisables
    │   │   ├── ui/        # Shadcn UI components
    │   │   └── Layout.js
    │   ├── pages/         # Pages principales
    │   │   ├── LoginPage.js
    │   │   ├── DashboardPage.js
    │   │   └── FleetPage.js
    │   ├── App.js
    │   └── index.js
    ├── package.json
    └── .env
```

---

## API Endpoints Principaux

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Profil utilisateur

### Véhicules
- `GET /api/vehicles` - Liste des véhicules
- `POST /api/vehicles` - Ajouter un véhicule
- `PUT /api/vehicles/{id}` - Modifier un véhicule
- `DELETE /api/vehicles/{id}` - Supprimer un véhicule

### Dashboard
- `GET /api/reports/dashboard` - Statistiques dashboard
- `GET /api/reports/fleet` - Rapport flotte
- `GET /api/reports/financial` - Rapport financier

### Clients
- `GET /api/clients` - Liste clients
- `POST /api/clients` - Ajouter client
- `PUT /api/clients/{id}/verify` - Vérifier client

### Contrats
- `GET /api/contracts` - Liste contrats
- `POST /api/contracts` - Créer contrat
- `POST /api/contracts/{id}/sign` - Signer contrat

### Réservations
- `GET /api/reservations` - Liste réservations
- `POST /api/reservations` - Créer réservation
- `PUT /api/reservations/{id}/status` - Modifier statut

### Paiements
- `GET /api/payments` - Liste paiements
- `POST /api/payments` - Enregistrer paiement

### Maintenance
- `GET /api/maintenance` - Liste maintenance
- `POST /api/maintenance` - Programmer maintenance
- `GET /api/maintenance/alerts` - Alertes maintenance

### Infractions
- `GET /api/infractions` - Liste infractions
- `POST /api/infractions` - Enregistrer infraction

---

## Design System

### Palette de Couleurs "Asphalt & Gold"
- **Primary (Asphalt):** #0F172A (Slate 900)
- **Secondary (Daylight):** #F8FAFC (Slate 50)
- **Accent (Signal Amber):** #F59E0B (Amber 500)
- **Brand (Corporate Blue):** #2563EB (Blue 600)
- **Success (Emerald):** #10B981 (Emerald 500)
- **Danger (Redline):** #EF4444 (Red 500)

### Typographie
- **Headings:** Chivo (Bold, Black, Uppercase)
- **Body:** IBM Plex Sans / IBM Plex Sans Arabic
- **Data:** Monospace

---

## Notes de Développement

### Langues Supportées
- **Français (fr):** LTR, IBM Plex Sans
- **Arabe (عربي, ar):** RTL, IBM Plex Sans Arabic

### Conventions de Code
- Backend: Python/FastAPI avec type hints
- Frontend: React functional components avec hooks
- State management: React Context API
- Styling: Tailwind CSS + Shadcn UI
- Icons: Lucide React

### Environnement de Développement
- Backend hot reload activé
- Frontend hot reload activé
- MongoDB local sur port 27017

---

## Prochaines Étapes

1. **Compléter les pages frontend restantes:**
   - Clients
   - Réservations (avec calendrier)
   - Contrats (avec signature)
   - Paiements
   - Maintenance
   - Infractions
   - Rapports (avec graphiques)

2. **Intégrations:**
   - GPS tracking iframe
   - Signature canvas pour contrats
   - Facturation électronique algérienne

3. **Améliorations:**
   - Tests automatiques
   - Documentation API complète
   - Optimisations performances
   - Sécurité renforcée

---

## Support

Pour toute question ou problème, contactez l'équipe de développement.

**Version:** 1.0.0 (MVP)
**Date:** Décembre 2025