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
  Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Layout = ({ children }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { user, logout, getAuthHeaders } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API}/messages/unread-count`, { headers: getAuthHeaders() });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      // Silently fail
    }
  };
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard', roles: ['superadmin', 'admin', 'employee'] },
    { icon: Crown, label: language === 'fr' ? 'Super Admin' : 'المدير العام', path: '/admin', roles: ['superadmin'] },
    { icon: Car, label: t('fleet'), path: '/fleet', roles: ['superadmin', 'admin', 'employee'] },
    { icon: Users, label: language === 'fr' ? 'Employés' : 'الموظفون', path: '/employees', roles: ['superadmin', 'admin'] },
    { icon: Calendar, label: t('reservations'), path: '/reservations', roles: ['superadmin', 'admin', 'employee'] },
    { icon: FileText, label: t('contracts'), path: '/contracts', roles: ['superadmin', 'admin', 'employee'] },
    { icon: CreditCard, label: t('payments'), path: '/payments', roles: ['superadmin', 'admin', 'employee'] },
    { icon: Wrench, label: t('maintenance'), path: '/maintenance', roles: ['superadmin', 'admin', 'employee'] },
    { icon: AlertTriangle, label: t('infractions'), path: '/infractions', roles: ['superadmin', 'admin', 'employee'] },
    { icon: BarChart3, label: t('reports'), path: '/reports', roles: ['superadmin', 'admin'] },
  ];
  
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getRoleBadge = (role) => {
    switch(role) {
      case 'superadmin': return '👑 Super Admin';
      case 'admin': return '🔑 Admin';
      default: return '👤 ' + (language === 'fr' ? 'Employé' : 'موظف');
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
          <div className={`mt-4 p-3 rounded-lg border ${user?.role === 'superadmin' ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' : 'bg-gradient-to-br from-cyan-50 to-violet-50 border-cyan-200'}`}>
            <p className="text-sm text-slate-700 font-medium" data-testid="user-info">{user?.full_name}</p>
            <p className={`text-xs font-semibold ${user?.role === 'superadmin' ? 'text-amber-600' : 'text-cyan-600'}`} data-testid="user-role">{getRoleBadge(user?.role)}</p>
          </div>
        </div>
        
        <nav className="p-4 overflow-y-auto h-[calc(100vh-320px)]" data-testid="navigation">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
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
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
