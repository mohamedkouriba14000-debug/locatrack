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
  Bell,
  Sparkles
} from 'lucide-react';
import { playSyntheticSound } from '../utils/sounds';

const Layout = ({ children }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard', roles: ['admin', 'employee'], color: 'cyan' },
    { icon: Car, label: t('fleet'), path: '/fleet', roles: ['admin', 'employee'], color: 'violet' },
    { icon: Users, label: language === 'fr' ? 'Employés' : 'الموظفون', path: '/employees', roles: ['admin'], color: 'blue' },
    { icon: Calendar, label: t('reservations'), path: '/reservations', roles: ['admin', 'employee'], color: 'blue' },
    { icon: FileText, label: t('contracts'), path: '/contracts', roles: ['admin', 'employee'], color: 'purple' },
    { icon: CreditCard, label: t('payments'), path: '/payments', roles: ['admin', 'employee'], color: 'green' },
    { icon: Wrench, label: t('maintenance'), path: '/maintenance', roles: ['admin', 'employee'], color: 'orange' },
    { icon: AlertTriangle, label: t('infractions'), path: '/infractions', roles: ['admin', 'employee'], color: 'red' },
    { icon: BarChart3, label: t('reports'), path: '/reports', roles: ['admin'], color: 'indigo' },
  ];
  
  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user?.role));
  
  const handleLogout = () => {
    playSyntheticSound('click');
    logout();
    navigate('/login');
  };
  
  const handleNavClick = () => playSyntheticSound('click');
  const handleLanguageToggle = () => { playSyntheticSound('click'); toggleLanguage(); };
  
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
          <div className="mt-4 p-3 bg-gradient-to-br from-cyan-50 to-violet-50 rounded-lg border border-cyan-200">
            <p className="text-sm text-slate-700 font-medium" data-testid="user-info">{user?.full_name}</p>
            <p className="text-xs text-cyan-600 font-semibold" data-testid="user-role">{t(user?.role)}</p>
          </div>
        </div>
        
        <nav className="p-4 overflow-y-auto h-[calc(100vh-280px)]" data-testid="navigation">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    data-testid={`nav-${item.path.substring(1)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-100 to-violet-100 text-cyan-700 border-2 border-cyan-300 shadow-md'
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
        
        <div className="absolute bottom-0 start-0 w-full p-4 border-t border-slate-200 bg-white">
          <Button
            onClick={handleLanguageToggle}
            variant="outline"
            className="w-full mb-2 justify-start border-slate-300 hover:border-cyan-500 hover:bg-cyan-50"
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative hover:bg-slate-100" 
            onClick={() => playSyntheticSound('notification')}
            data-testid="notifications-button"
          >
            <Bell size={20} className="text-slate-600" />
            <span className="absolute top-1 end-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
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
