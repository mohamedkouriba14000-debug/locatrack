import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Car,
  Users,
  FileText,
  DollarSign,
  AlertTriangle,
  Wrench,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { t, language } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/reports/dashboard`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const statCards = [
    {
      title: t('totalVehicles'),
      value: stats?.total_vehicles || 0,
      icon: Car,
      color: 'from-cyan-500 to-cyan-600',
      testId: 'stat-total-vehicles'
    },
    {
      title: t('availableVehicles'),
      value: stats?.available_vehicles || 0,
      icon: CheckCircle,
      color: 'from-emerald-500 to-emerald-600',
      testId: 'stat-available-vehicles'
    },
    {
      title: t('rentedVehicles'),
      value: stats?.rented_vehicles || 0,
      icon: TrendingUp,
      color: 'from-violet-500 to-violet-600',
      testId: 'stat-rented-vehicles'
    },
    {
      title: t('totalClients'),
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      testId: 'stat-total-clients'
    },
    {
      title: t('activeContracts'),
      value: stats?.active_contracts || 0,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      testId: 'stat-active-contracts'
    },
    {
      title: t('revenue30d'),
      value: `${stats?.total_revenue_30d?.toLocaleString() || 0} DZD`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      testId: 'stat-revenue'
    },
    {
      title: t('pendingInfractions'),
      value: stats?.pending_infractions || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      testId: 'stat-infractions'
    },
    {
      title: t('upcomingMaintenance'),
      value: stats?.upcoming_maintenance || 0,
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      testId: 'stat-maintenance'
    },
  ];
  
  // Filter stats for client role
  const visibleStats = user?.role === 'client' 
    ? statCards.filter(card => ['stat-active-contracts', 'stat-rented-vehicles'].includes(card.testId))
    : statCards;
  
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12" data-testid="dashboard-loading">{t('loading')}</div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div data-testid="dashboard-page">
        <h1 className="font-heading font-bold text-4xl mb-8 uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500" data-testid="dashboard-title">
          {t('dashboard')}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.testId} className="glass border-slate-800/50 hover:border-cyan-500/50 transition-all group" data-testid={stat.testId}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <Icon className="text-white" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight text-slate-100 font-heading" data-testid={`${stat.testId}-value`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {user?.role !== 'client' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-slate-800/50" data-testid="quick-actions-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase text-cyan-400">
                  {language === 'fr' ? 'Actions rapides' : 'إجراءات سريعة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-4 glass rounded-lg hover:border-cyan-500/50 border border-transparent cursor-pointer transition-all" data-testid="quick-action-vehicle">
                    <p className="font-medium text-slate-300">
                      {language === 'fr' ? 'Ajouter un véhicule' : 'إضافة مركبة'}
                    </p>
                  </div>
                  <div className="p-4 glass rounded-lg hover:border-cyan-500/50 border border-transparent cursor-pointer transition-all" data-testid="quick-action-reservation">
                    <p className="font-medium text-slate-300">
                      {language === 'fr' ? 'Nouvelle réservation' : 'حجز جديد'}
                    </p>
                  </div>
                  <div className="p-4 glass rounded-lg hover:border-cyan-500/50 border border-transparent cursor-pointer transition-all" data-testid="quick-action-contract">
                    <p className="font-medium text-slate-300">
                      {language === 'fr' ? 'Créer un contrat' : 'إنشاء عقد'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass border-slate-800/50" data-testid="recent-activity-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase text-violet-400">
                  {language === 'fr' ? 'Activité récente' : 'النشاط الأخير'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500" data-testid="no-activity">
                  {t('noData')}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;