import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReportsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [fleetReport, setFleetReport] = useState(null);
  const [financialReport, setFinancialReport] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchReports(); }, []);
  
  const fetchReports = async () => {
    try {
      const [fleet, financial] = await Promise.all([
        axios.get(`${API}/reports/fleet`, { headers: getAuthHeaders() }),
        axios.get(`${API}/reports/financial`, { headers: getAuthHeaders() })
      ]);
      setFleetReport(fleet.data);
      setFinancialReport(financial.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  
  const statusData = fleetReport ? Object.entries(fleetReport.status_breakdown || {}).map(([name, value]) => ({ name, value })) : [];
  const typeData = fleetReport ? Object.entries(fleetReport.type_breakdown || {}).map(([name, value]) => ({ name, value })) : [];
  const monthlyData = financialReport ? Object.entries(financialReport.monthly_revenue || {}).map(([month, revenue]) => ({ month, revenue })) : [];
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <h1 className="font-heading font-bold text-4xl mb-8 uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{t('reports')}</h1>
        
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign size={24} /> {language === 'fr' ? 'Revenus Totaux' : 'إجمالي الإيرادات'}</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">{financialReport?.total_revenue?.toLocaleString() || 0} DZD</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-orange-500 text-white border-0 shadow-xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp size={24} /> {language === 'fr' ? 'Coûts Maintenance' : 'تكاليف الصيانة'}</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">{financialReport?.total_maintenance_cost?.toLocaleString() || 0} DZD</p></CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-violet-500 text-white border-0 shadow-xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 size={24} /> {language === 'fr' ? 'Bénéfice Net' : 'صافي الربح'}</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-black">{financialReport?.net_profit?.toLocaleString() || 0} DZD</p></CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-2 border-slate-200 shadow-lg">
            <CardHeader><CardTitle className="text-slate-800">📈 {language === 'fr' ? 'Revenus Mensuels' : 'الإيرادات الشهرية'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#06b6d4" name={language === 'fr' ? 'Revenus' : 'الإيرادات'} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-2 border-slate-200 shadow-lg">
            <CardHeader><CardTitle className="text-slate-800">🚗 {language === 'fr' ? 'Véhicules par Statut' : 'المركبات حسب الحالة'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-2 border-slate-200 shadow-lg">
            <CardHeader><CardTitle className="text-slate-800">🖊️ {language === 'fr' ? 'Véhicules par Type' : 'المركبات حسب النوع'}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={typeData} cx="50%" cy="50%" labelLine={false} label={(entry) => entry.name} outerRadius={80} fill="#8884d8" dataKey="value">
                    {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-2 border-slate-200 shadow-lg">
            <CardHeader><CardTitle className="text-slate-800">📄 {language === 'fr' ? 'Statistiques Flotte' : 'إحصائيات الأسطول'}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border-2 border-cyan-200">
                  <p className="text-sm text-slate-600">{language === 'fr' ? 'Total Véhicules' : 'إجمالي المركبات'}</p>
                  <p className="text-3xl font-bold text-cyan-700">{fleetReport?.total_vehicles || 0}</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(fleetReport?.status_breakdown || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-700 font-medium capitalize">{status}</span>
                      <span className="font-bold text-slate-800">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;