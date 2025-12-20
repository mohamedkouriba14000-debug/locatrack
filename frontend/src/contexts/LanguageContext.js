import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de bord',
    fleet: 'Flotte',
    clients: 'Clients',
    reservations: 'Réservations',
    contracts: 'Contrats',
    payments: 'Paiements',
    maintenance: 'Maintenance',
    infractions: 'Infractions',
    reports: 'Rapports',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    
    // Auth
    login: 'Connexion',
    register: 'S\'inscrire',
    email: 'Email',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    phone: 'Téléphone',
    role: 'Rôle',
    admin: 'Administrateur',
    employee: 'Employé',
    client: 'Client',
    
    // Dashboard
    totalVehicles: 'Total véhicules',
    availableVehicles: 'Véhicules disponibles',
    rentedVehicles: 'Véhicules loués',
    totalClients: 'Total clients',
    activeContracts: 'Contrats actifs',
    revenue30d: 'Revenus 30j',
    pendingInfractions: 'Infractions en attente',
    upcomingMaintenance: 'Maintenance à venir',
    
    // Vehicles
    addVehicle: 'Ajouter véhicule',
    registrationNumber: 'Numéro d\'immatriculation',
    type: 'Type',
    make: 'Marque',
    model: 'Modèle',
    year: 'Année',
    chassisNumber: 'Numéro de châssis',
    color: 'Couleur',
    insuranceNumber: 'Numéro d\'assurance',
    insuranceExpiry: 'Expiration assurance',
    dailyRate: 'Tarif journalier',
    status: 'Statut',
    available: 'Disponible',
    rented: 'Loué',
    maintenance: 'Maintenance',
    unavailable: 'Indisponible',
    
    // Actions
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    search: 'Rechercher',
    filter: 'Filtrer',
    confirm: 'Confirmer',
    close: 'Fermer',
    view: 'Voir',
    download: 'Télécharger',
    
    // Status
    active: 'Actif',
    pending: 'En attente',
    completed: 'Terminé',
    cancelled: 'Annulé',
    verified: 'Vérifié',
    
    // Messages
    success: 'Succès',
    error: 'Erreur',
    loading: 'Chargement...',
    noData: 'Aucune donnée',
    connected: 'Connecté',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    fleet: 'الأسطول',
    clients: 'العملاء',
    reservations: 'الحجوزات',
    contracts: 'العقود',
    payments: 'المدفوعات',
    maintenance: 'الصيانة',
    infractions: 'المخالفات',
    reports: 'التقارير',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'التسجيل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    fullName: 'الاسم الكامل',
    phone: 'الهاتف',
    role: 'الدور',
    admin: 'مدير',
    employee: 'موظف',
    client: 'عميل',
    
    // Dashboard
    totalVehicles: 'إجمالي المركبات',
    availableVehicles: 'المركبات المتاحة',
    rentedVehicles: 'المركبات المؤجرة',
    totalClients: 'إجمالي العملاء',
    activeContracts: 'العقود النشطة',
    revenue30d: 'الإيرادات 30 يوم',
    pendingInfractions: 'المخالفات المعلقة',
    upcomingMaintenance: 'الصيانة القادمة',
    
    // Vehicles
    addVehicle: 'إضافة مركبة',
    registrationNumber: 'رقم التسجيل',
    type: 'النوع',
    make: 'الماركة',
    model: 'الطراز',
    year: 'السنة',
    chassisNumber: 'رقم الهيكل',
    color: 'اللون',
    insuranceNumber: 'رقم التأمين',
    insuranceExpiry: 'انتهاء التأمين',
    dailyRate: 'السعر اليومي',
    status: 'الحالة',
    available: 'متاح',
    rented: 'مؤجر',
    maintenance: 'صيانة',
    unavailable: 'غير متاح',
    
    // Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث',
    filter: 'تصفية',
    confirm: 'تأكيد',
    close: 'إغلاق',
    view: 'عرض',
    download: 'تحميل',
    
    // Status
    active: 'نشط',
    pending: 'قيد الانتظار',
    completed: 'مكتمل',
    cancelled: 'ملغى',
    verified: 'موثق',
    
    // Messages
    success: 'نجاح',
    error: 'خطأ',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    connected: 'متصل',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  
  useEffect(() => {
    // Set HTML dir and lang attributes
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Update font family based on language
    if (language === 'ar') {
      document.body.style.fontFamily = '"IBM Plex Sans Arabic", sans-serif';
    } else {
      document.body.style.fontFamily = '"IBM Plex Sans", sans-serif';
    }
  }, [language]);
  
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'fr' ? 'ar' : 'fr');
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};