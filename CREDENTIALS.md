# LocaTrack - Plateforme SaaS de Location de Véhicules

## 🏢 Modèle SaaS Multi-Tenant

### Architecture des Rôles

| Rôle | Description | Accès |
|------|-------------|-------|
| 👑 **SuperAdmin** | Admin plateforme | Gestion des Locateurs, statistiques globales |
| 🏢 **Locateur** | Propriétaire entreprise | Toutes les fonctionnalités + gestion employés |
| 👤 **Employé** | Travaille pour un Locateur | Flotte, réservations, contrats (sans accès employés) |

---

## Comptes de Test / حسابات الاختبار

### 👑 Super Administrateur (Plateforme)
- **Email:** superadmin@locatrack.dz
- **Password:** superadmin123
- **Accès:** Gestion plateforme uniquement

---

## Comment Créer un Compte Locateur

1. Allez sur la page de connexion
2. Cliquez sur "**Créer un compte Locateur**"
3. Remplissez le formulaire :
   - Nom de l'entreprise
   - Votre nom complet
   - Email
   - Téléphone
   - Mot de passe

---

## Comment Créer un Employé (pour Locateur)

1. Connectez-vous en tant que Locateur
2. Allez dans le menu "**Employés**"
3. Cliquez sur "**Ajouter Employé**"
4. Créez le compte avec :
   - Nom complet
   - Email
   - Téléphone
   - Mot de passe temporaire

L'employé pourra ensuite se connecter avec son email et mot de passe.

---

## Fonctionnalités par Rôle

### 🏢 Locateur
- ✅ Tableau de bord avec statistiques
- ✅ Gestion de la flotte (véhicules)
- ✅ Gestion des employés
- ✅ Réservations
- ✅ Contrats (avec signature numérique)
- ✅ Paiements
- ✅ Maintenance
- ✅ Infractions
- ✅ Rapports financiers
- ✅ Messagerie avec employés

### 👤 Employé
- ✅ Tableau de bord
- ✅ Gestion de la flotte
- ✅ Réservations
- ✅ Contrats
- ✅ Paiements
- ✅ Maintenance
- ✅ Infractions
- ✅ Messagerie avec Locateur
- ❌ Gestion des employés
- ❌ Rapports financiers

### 👑 SuperAdmin
- ✅ Liste des Locateurs inscrits
- ✅ Statistiques globales (véhicules, contrats)
- ✅ Modifier/Supprimer des utilisateurs
- ❌ Accès aux données des Locateurs (isolement)

---

**Version:** 2.0 SaaS
**Date:** Décembre 2025
