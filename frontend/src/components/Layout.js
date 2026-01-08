import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import axios from 'axios';
import {
  LayoutDashboard,
  Car,
  Users,
  UserCheck,
  Calendar,
  FileText,
  CreditCard,
  Wrench,
  AlertTriangle,
  BarChart3,
  LogOut,
  Languages,
  MessageCircle,
  Crown,
  Sparkles,
  Building2,
  MapPin,
  Settings,
  Bell
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Layout = ({ children }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { user, logout, getAuthHeaders } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  useEffect(() => {
    if (user?.role !== 'superadmin') {
      fetchUnreadCount();
      fetchNotifications();
      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchNotifications();
      }, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);
  
  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API}/notifications`, { headers: getAuthHeaders() });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API}/messages/unread-count`, { headers: getAuthHeaders() });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      // Silently fail
    }
  };
  
  // Menu items based on role
  const getMenuItems = () => {
    // SuperAdmin only sees platform management
    if (user?.role === 'superadmin') {
      return [
        { icon: Crown, label: language === 'fr' ? 'Gestion Plateforme' : 'إدارة المنصة', path: '/admin' },
      ];
    }
    
    // Locateur sees everything including employees
    if (user?.role === 'locateur') {
      return [
        { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
        { icon: Car, label: t('fleet'), path: '/fleet' },
        { icon: MapPin, label: language === 'fr' ? 'Suivi GPS' : 'تتبع GPS', path: '/gps-tracking' },
        { icon: Users, label: language === 'fr' ? 'Employés' : 'الموظفون', path: '/employees' },
        { icon: UserCheck, label: language === 'fr' ? 'Clients' : 'العملاء', path: '/clients' },
        { icon: Calendar, label: t('reservations'), path: '/reservations' },
        { icon: FileText, label: t('contracts'), path: '/contracts' },
        { icon: CreditCard, label: t('payments'), path: '/payments' },
        { icon: Wrench, label: t('maintenance'), path: '/maintenance' },
        { icon: AlertTriangle, label: t('infractions'), path: '/infractions' },
        { icon: BarChart3, label: t('reports'), path: '/reports' },
        { icon: Settings, label: language === 'fr' ? 'Paramètres' : 'الإعدادات', path: '/settings' },
      ];
    }
    
    // Employee sees operational pages only (no employees section)
    return [
      { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
      { icon: Car, label: t('fleet'), path: '/fleet' },
      { icon: MapPin, label: language === 'fr' ? 'Suivi GPS' : 'تتبع GPS', path: '/gps-tracking' },
      { icon: UserCheck, label: language === 'fr' ? 'Clients' : 'العملاء', path: '/clients' },
      { icon: Calendar, label: t('reservations'), path: '/reservations' },
      { icon: FileText, label: t('contracts'), path: '/contracts' },
      { icon: CreditCard, label: t('payments'), path: '/payments' },
      { icon: Wrench, label: t('maintenance'), path: '/maintenance' },
      { icon: AlertTriangle, label: t('infractions'), path: '/infractions' },
    ];
  };
  
  const menuItems = getMenuItems();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getRoleBadge = (role) => {
    switch(role) {
      case 'superadmin': return '👑 Super Admin';
      case 'locateur': return '🏢 ' + (language === 'fr' ? 'Locateur' : 'مؤجر');
      default: return '👤 ' + (language === 'fr' ? 'Employé' : 'موظف');
    }
  };
  
  const getRoleColor = (role) => {
    switch(role) {
      case 'superadmin': return 'from-amber-50 to-amber-100 border-amber-200';
      case 'locateur': return 'from-emerald-50 to-emerald-100 border-emerald-200';
      default: return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };
  
  const getRoleTextColor = (role) => {
    switch(role) {
      case 'superadmin': return 'text-amber-600';
      case 'locateur': return 'text-emerald-600';
      default: return 'text-blue-600';
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50" data-testid="main-layout">
      {/* Sidebar */}
      <aside className="fixed top-0 start-0 h-full w-64 glass-light border-e border-slate-200 shadow-xl z-50" data-testid="sidebar">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="bg-gradient-to-br from-cyan-500 to-violet-600 p-2 rounded-xl">
                <Car size={28} className="text-white" />
              </div>
              <Sparkles size={14} className="absolute -top-1 -end-1 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-violet-600" data-testid="app-title">
                LocaTrack
              </h1>
              <p className="text-xs text-slate-500">v2.0</p>
            </div>
          </div>
          <div className={`mt-4 p-3 rounded-lg border bg-gradient-to-br ${getRoleColor(user?.role)}`}>
            <p className="text-sm text-slate-700 font-medium" data-testid="user-info">{user?.full_name}</p>
            {user?.company_name && <p className="text-xs text-slate-500">{user?.company_name}</p>}
            <p className={`text-xs font-semibold ${getRoleTextColor(user?.role)}`} data-testid="user-role">{getRoleBadge(user?.role)}</p>
          </div>
        </div>
        
        <nav className="p-4 overflow-y-auto h-[calc(100vh-320px)]" data-testid="navigation">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isSuperAdminLink = item.path === '/admin';
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.path.substring(1)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive
                        ? isSuperAdminLink 
                          ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border-2 border-amber-300 shadow-md'
                          : 'bg-gradient-to-r from-cyan-100 to-violet-100 text-cyan-700 border-2 border-cyan-300 shadow-md'
                        : isSuperAdminLink
                          ? 'text-amber-600 hover:bg-amber-50 hover:text-amber-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="absolute bottom-0 start-0 w-full p-4 border-t border-slate-200 bg-white space-y-2">
          {user?.role !== 'superadmin' && (
            <Link to="/messages">
              <Button
                variant="outline"
                className={`w-full justify-start border-slate-300 hover:border-cyan-500 hover:bg-cyan-50 ${location.pathname === '/messages' ? 'bg-cyan-50 border-cyan-300' : ''}`}
                data-testid="messages-button"
              >
                <MessageCircle size={20} className="me-2 text-cyan-600" />
                <span className="text-slate-700 flex-1 text-start">{language === 'fr' ? 'Messages' : 'الرسائل'}</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </Button>
            </Link>
          )}
          <Button
            onClick={toggleLanguage}
            variant="outline"
            className="w-full justify-start border-slate-300 hover:border-cyan-500 hover:bg-cyan-50"
            data-testid="language-toggle"
          >
            <Languages size={20} className="me-2 text-violet-600" />
            <span className="text-slate-700">{language === 'fr' ? 'العربية' : 'Français'}</span>
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200"
            data-testid="logout-button"
          >
            <LogOut size={20} className="me-2" />
            {t('logout')}
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="ms-64 min-h-screen" data-testid="main-content">
        {/* Top Bar */}
        <div className="glass-light border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-600 font-medium">{t('connected')}</span>
          </div>
          {user?.role !== 'superadmin' && (
            <Link to="/messages">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-slate-100"
                data-testid="notifications-button"
              >
                <MessageCircle size={20} className="text-slate-600" />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                    <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </>
                )}
              </Button>
            </Link>
          )}
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
