import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Wrench, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MaintenancePage = () => {
  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [maintenances, setMaintenances] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [maintenanceRes, alertsRes] = await Promise.all([
        axios.get(`${API}/maintenance`, { headers: getAuthHeaders() }),
        axios.get(`${API}/maintenance/alerts`, { headers: getAuthHeaders() })
      ]);
      setMaintenances(maintenanceRes.data);
      setAlerts(alertsRes.data.alerts || []);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
  };
  
  const getTypeColor = (type) => {
    const colors = { preventive: 'from-blue-500 to-blue-600', emergency: 'from-red-500 to-red-600', repair: 'from-orange-500 to-orange-600' };
    return colors[type] || 'from-slate-500 to-slate-600';
  };
  
  const getStatusColor = (status) => {
    const colors = { scheduled: 'from-cyan-500 to-cyan-600', in_progress: 'from-orange-500 to-orange-600', completed: 'from-emerald-500 to-emerald-600', cancelled: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">{t('maintenance')}</h1>
          <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
            <Plus size={20} className="me-2" /> Programmer Maintenance
          </Button>
        </div>
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle size={24} /> {alerts.length} Alerte(s) Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border-2 border-red-200 text-sm">
                    <span className="font-bold text-red-600">Véhicule {alert.vehicle_id?.substring(0, 8)}</span> - {alert.description}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maintenances.map((maintenance) => (
            <Card key={maintenance.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-gradient-to-br ${getTypeColor(maintenance.type)} rounded-full`}>
                    <Wrench size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{maintenance.description}</CardTitle>
                    <p className="text-sm text-slate-500">Véhicule: {maintenance.vehicle_id.substring(0, 8)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /><span className="text-slate-600">Planifié:</span><span className="font-medium text-slate-800">{new Date(maintenance.scheduled_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Type:</span><span className={`font-bold px-2 py-1 rounded ${maintenance.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{maintenance.type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Coût:</span><span className="font-bold text-orange-600">{maintenance.cost} DZD</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(maintenance.status)} text-white text-center font-bold uppercase text-sm`}>{maintenance.status}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {maintenances.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default MaintenancePage;