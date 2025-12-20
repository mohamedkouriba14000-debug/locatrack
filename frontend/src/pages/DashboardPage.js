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
      color: 'bg-blue-500',
      testId: 'stat-total-vehicles'
    },
    {
      title: t('availableVehicles'),
      value: stats?.available_vehicles || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      testId: 'stat-available-vehicles'
    },
    {
      title: t('rentedVehicles'),
      value: stats?.rented_vehicles || 0,
      icon: TrendingUp,
      color: 'bg-amber-500',
      testId: 'stat-rented-vehicles'
    },
    {
      title: t('totalClients'),
      value: stats?.total_clients || 0,
      icon: Users,
      color: 'bg-blue-600',
      testId: 'stat-total-clients'
    },
    {
      title: t('activeContracts'),
      value: stats?.active_contracts || 0,
      icon: FileText,
      color: 'bg-purple-500',
      testId: 'stat-active-contracts'
    },
    {
      title: t('revenue30d'),
      value: `${stats?.total_revenue_30d?.toLocaleString() || 0} DZD`,
      icon: DollarSign,
      color: 'bg-green-500',
      testId: 'stat-revenue'
    },
    {
      title: t('pendingInfractions'),
      value: stats?.pending_infractions || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      testId: 'stat-infractions'
    },
    {
      title: t('upcomingMaintenance'),
      value: stats?.upcoming_maintenance || 0,
      icon: Wrench,
      color: 'bg-orange-500',
      testId: 'stat-maintenance'
    },
  ];
  
  // Filter stats for client role
  const visibleStats = user?.role === 'client' 
    ? statCards.filter(card => ['activeContracts', 'rentedVehicles'].includes(card.testId.replace('stat-', '')))
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
        <h1 className="font-heading font-black text-4xl mb-8 uppercase tracking-tight" data-testid="dashboard-title">
          {t('dashboard')}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.testId} className="border-slate-200 hover:shadow-md transition-all" data-testid={stat.testId}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.color} p-2 rounded-sm`}>
                    <Icon className="text-white" size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tracking-tight" data-testid={`${stat.testId}-value`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {user?.role !== 'client' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="quick-actions-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase">
                  {language === 'fr' ? 'Actions rapides' : 'إجراءات سريعة'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-4 bg-slate-50 rounded-sm hover:bg-slate-100 cursor-pointer transition-all" data-testid="quick-action-vehicle">
                    <p className="font-medium">
                      {language === 'fr' ? 'Ajouter un véhicule' : 'إضافة مركبة'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-sm hover:bg-slate-100 cursor-pointer transition-all" data-testid="quick-action-reservation">
                    <p className="font-medium">
                      {language === 'fr' ? 'Nouvelle réservation' : 'حجز جديد'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-sm hover:bg-slate-100 cursor-pointer transition-all" data-testid="quick-action-contract">
                    <p className="font-medium">
                      {language === 'fr' ? 'Créer un contrat' : 'إنشاء عقد'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card data-testid="recent-activity-card">
              <CardHeader>
                <CardTitle className="font-heading text-xl uppercase">
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