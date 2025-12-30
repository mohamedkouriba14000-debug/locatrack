import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Car, Users, FileText, DollarSign, AlertTriangle, Wrench, TrendingUp, CheckCircle, Calendar, UserPlus, Plus } from 'lucide-react';
import { playSyntheticSound } from '../utils/sounds';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard`, { headers: getAuthHeaders() });
      setStats(response.data);
      playSyntheticSound('success');
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const statCards = [
    { title: t('totalVehicles'), value: stats?.total_vehicles || 0, icon: Car, gradient: 'from-cyan-500 to-cyan-600', testId: 'stat-total-vehicles' },
    { title: t('availableVehicles'), value: stats?.available_vehicles || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-emerald-600', testId: 'stat-available-vehicles' },
    { title: t('rentedVehicles'), value: stats?.rented_vehicles || 0, icon: TrendingUp, gradient: 'from-violet-500 to-violet-600', testId: 'stat-rented-vehicles' },
    { title: t('totalClients'), value: stats?.total_clients || 0, icon: Users, gradient: 'from-blue-500 to-blue-600', testId: 'stat-total-clients' },
    { title: t('activeContracts'), value: stats?.active_contracts || 0, icon: FileText, gradient: 'from-purple-500 to-purple-600', testId: 'stat-active-contracts' },
    { title: t('revenue30d'), value: `${stats?.total_revenue_30d?.toLocaleString() || 0} DZD`, icon: DollarSign, gradient: 'from-green-500 to-green-600', testId: 'stat-revenue' },
    { title: t('pendingInfractions'), value: stats?.pending_infractions || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-600', testId: 'stat-infractions' },
    { title: t('upcomingMaintenance'), value: stats?.upcoming_maintenance || 0, icon: Wrench, gradient: 'from-orange-500 to-orange-600', testId: 'stat-maintenance' },
  ];
  
  const visibleStats = user?.role === 'client' ? statCards.filter(card => ['stat-active-contracts', 'stat-rented-vehicles'].includes(card.testId)) : statCards;
  
  if (loading) return <Layout><div className="text-center py-12 text-slate-600" data-testid="dashboard-loading">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div data-testid="dashboard-page">
        <h1 className="font-heading font-bold text-4xl mb-8 uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-violet-600" data-testid="dashboard-title">
          {t('dashboard')}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.testId} className="bg-white border-2 border-slate-200 hover:border-cyan-300 card-hover shadow-lg" data-testid={stat.testId}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 uppercase tracking-wide">{stat.title}</CardTitle>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-md`}>
                    <Icon className="text-white" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight text-slate-800 font-heading" data-testid={`${stat.testId}-value`}>{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {user?.role !== 'client' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border-2 border-slate-200 shadow-lg" data-testid="quick-actions-card">
              <CardHeader><CardTitle className="font-heading text-xl uppercase text-cyan-600">⚡ {language === 'fr' ? 'Actions rapides' : 'إجراءات سريعة'}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Ajouter un véhicule', 'Nouvelle réservation', 'Créer un contrat'].map((action, i) => (
                    <div key={i} onClick={() => playSyntheticSound('click')} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg hover:from-cyan-50 hover:to-violet-50 border-2 border-slate-200 hover:border-cyan-300 cursor-pointer transition-all" data-testid={`quick-action-${i}`}>
                      <p className="font-medium text-slate-700">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-slate-200 shadow-lg" data-testid="recent-activity-card">
              <CardHeader><CardTitle className="font-heading text-xl uppercase text-violet-600">📊 {language === 'fr' ? 'Activité récente' : 'النشاط الأخير'}</CardTitle></CardHeader>
              <CardContent><div className="text-sm text-slate-500" data-testid="no-activity">{t('noData')}</div></CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;