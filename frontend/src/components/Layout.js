import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
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
  Bell
} from 'lucide-react';

const Layout = ({ children }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard', roles: ['admin', 'employee', 'client'] },
    { icon: Car, label: t('fleet'), path: '/fleet', roles: ['admin', 'employee'] },
    { icon: Users, label: t('clients'), path: '/clients', roles: ['admin', 'employee'] },
    { icon: Calendar, label: t('reservations'), path: '/reservations', roles: ['admin', 'employee', 'client'] },
    { icon: FileText, label: t('contracts'), path: '/contracts', roles: ['admin', 'employee', 'client'] },
    { icon: CreditCard, label: t('payments'), path: '/payments', roles: ['admin', 'employee'] },
    { icon: Wrench, label: t('maintenance'), path: '/maintenance', roles: ['admin', 'employee'] },
    { icon: AlertTriangle, label: t('infractions'), path: '/infractions', roles: ['admin', 'employee'] },
    { icon: BarChart3, label: t('reports'), path: '/reports', roles: ['admin'] },
  ];
  
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-slate-950 grid-bg" data-testid="main-layout">
      {/* Sidebar */}
      <aside className="fixed top-0 start-0 h-full w-64 glass border-e border-slate-800/50 shadow-2xl" data-testid="sidebar">
        <div className="p-6 border-b border-slate-800/50">
          <h1 className="font-heading font-bold text-2xl tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500" data-testid="app-title">
            LocaTrack
          </h1>
          <p className="text-sm text-slate-300 mt-2" data-testid="user-info">{user?.full_name}</p>
          <p className="text-xs text-cyan-400 font-medium" data-testid="user-role">{t(user?.role)}</p>
        </div>
        
        <nav className="p-4" data-testid="navigation">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.path.substring(1)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 neon-border'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-cyan-300'
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
        
        <div className="absolute bottom-0 start-0 w-full p-4 border-t border-slate-800/50">
          <Button
            onClick={toggleLanguage}
            variant="outline"
            className="w-full mb-2 justify-start border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/10"
            data-testid="language-toggle"
          >
            <Languages size={20} className="me-2" />
            {language === 'fr' ? 'العربية' : 'Français'}
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
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
        <div className="glass border-b border-slate-800/50 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-400">{t('connected')}</span>
          </div>
          <Button variant="ghost" size="sm" className="relative" data-testid="notifications-button">
            <Bell size={20} className="text-slate-400" />
            <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;