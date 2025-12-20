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
  Settings,
  LogOut,
  Languages
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950" data-testid="main-layout">
      {/* Sidebar */}
      <aside className="fixed top-0 start-0 h-full w-64 bg-slate-900 text-white shadow-lg" data-testid="sidebar">
        <div className="p-6 border-b border-slate-800">
          <h1 className="font-heading font-black text-xl tracking-tight uppercase text-amber-500" data-testid="app-title">
            VehicleTrack Pro
          </h1>
          <p className="text-sm text-slate-400 mt-1" data-testid="user-info">{user?.full_name}</p>
          <p className="text-xs text-slate-500" data-testid="user-role">{t(user?.role)}</p>
        </div>
        
        <nav className="p-4" data-testid="navigation">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={`nav-${item.path.substring(1)}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
        
        <div className="absolute bottom-0 start-0 w-full p-4 border-t border-slate-800">
          <Button
            onClick={toggleLanguage}
            variant="outline"
            className="w-full mb-2 justify-start"
            data-testid="language-toggle"
          >
            <Languages size={20} className="me-2" />
            {language === 'fr' ? 'العربية' : 'Français'}
          </Button>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start"
            data-testid="logout-button"
          >
            <LogOut size={20} className="me-2" />
            {t('logout')}
          </Button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="ms-64 min-h-screen" data-testid="main-content">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;