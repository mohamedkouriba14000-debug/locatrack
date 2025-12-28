import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Wrench, Calendar, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MaintenancePage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: 'preventive',
    description: '',
    scheduled_date: '',
    cost: ''
  });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [maintenanceRes, alertsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/maintenance`, { headers: getAuthHeaders() }),
        axios.get(`${API}/maintenance/alerts`, { headers: getAuthHeaders() }),
        axios.get(`${API}/vehicles`, { headers: getAuthHeaders() })
      ]);
      setMaintenances(maintenanceRes.data);
      setAlerts(alertsRes.data.alerts || []);
      setVehicles(vehiclesRes.data);
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const maintenanceData = {
        ...formData,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        cost: parseFloat(formData.cost || 0)
      };
      
      await axios.post(`${API}/maintenance`, maintenanceData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Maintenance programmée' : 'تمت جدولة الصيانة');
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const updateMaintenanceStatus = async (maintenanceId, newStatus) => {
    try {
      await axios.put(`${API}/maintenance/${maintenanceId}`, { status: newStatus }, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Statut mis à jour' : 'تم تحديث الحالة');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      type: 'preventive',
      description: '',
      scheduled_date: '',
      cost: ''
    });
  };
  
  const getTypeColor = (type) => {
    const colors = { preventive: 'from-blue-500 to-blue-600', emergency: 'from-red-500 to-red-600', repair: 'from-orange-500 to-orange-600' };
    return colors[type] || 'from-slate-500 to-slate-600';
  };
  
  const getStatusColor = (status) => {
    const colors = { scheduled: 'from-cyan-500 to-cyan-600', in_progress: 'from-orange-500 to-orange-600', completed: 'from-emerald-500 to-emerald-600', cancelled: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : vehicleId.substring(0, 8);
  };
  
  const filteredMaintenances = maintenances.filter(m =>
    m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">{t('maintenance')}</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> {language === 'fr' ? 'Programmer Maintenance' : 'جدولة الصيانة'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-orange-600 font-heading text-2xl">{language === 'fr' ? 'Nouvelle Maintenance' : 'صيانة جديدة'}</DialogTitle>
                <DialogDescription className="text-slate-600">{language === 'fr' ? 'Programmer une intervention' : 'جدولة تدخل'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Véhicule' : 'المركبة'}</Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({...formData, vehicle_id: value})}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue placeholder={language === 'fr' ? 'Sélectionner véhicule' : 'اختر مركبة'} /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} - {vehicle.registration_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Type' : 'النوع'}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">🔧 {language === 'fr' ? 'Préventive' : 'وقائية'}</SelectItem>
                      <SelectItem value="repair">🔩 {language === 'fr' ? 'Réparation' : 'إصلاح'}</SelectItem>
                      <SelectItem value="emergency">🚨 {language === 'fr' ? 'Urgence' : 'طارئة'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Description' : 'الوصف'}</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-orange-500" placeholder={language === 'fr' ? 'Détails de l\'intervention...' : 'تفاصيل التدخل...'} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Date prévue' : 'التاريخ المقرر'}</Label>
                    <Input type="date" value={formData.scheduled_date} onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Coût estimé (DZD)' : 'التكلفة التقديرية'}</Label>
                    <Input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-orange-500" placeholder="0" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">{language === 'fr' ? 'Programmer' : 'جدولة'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle size={24} /> {alerts.length} {language === 'fr' ? 'Alerte(s) Maintenance' : 'تنبيه(ات) الصيانة'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border-2 border-red-200 text-sm">
                    <span className="font-bold text-red-600">{language === 'fr' ? 'Véhicule' : 'مركبة'} {getVehicleName(alert.vehicle_id)}</span> - {alert.description}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-orange-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaintenances.map((maintenance) => (
            <Card key={maintenance.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-gradient-to-br ${getTypeColor(maintenance.type)} rounded-full`}>
                    <Wrench size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{maintenance.description}</CardTitle>
                    <p className="text-sm text-slate-500">{getVehicleName(maintenance.vehicle_id)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Calendar size={16} className="text-slate-400" /><span className="text-slate-600">{language === 'fr' ? 'Planifié' : 'مخطط'}:</span><span className="font-medium text-slate-800">{new Date(maintenance.scheduled_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Type' : 'النوع'}:</span><span className={`font-bold px-2 py-1 rounded ${maintenance.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{maintenance.type}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Coût' : 'التكلفة'}:</span><span className="font-bold text-orange-600">{maintenance.cost?.toLocaleString() || 0} DZD</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(maintenance.status)} text-white text-center font-bold uppercase text-sm`}>{maintenance.status}</div>
                  
                  {maintenance.status === 'scheduled' && (
                    <div className="flex gap-2 mt-3">
                      <Button onClick={() => updateMaintenanceStatus(maintenance.id, 'in_progress')} size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs">{language === 'fr' ? 'Démarrer' : 'بدء'}</Button>
                      <Button onClick={() => updateMaintenanceStatus(maintenance.id, 'cancelled')} size="sm" variant="outline" className="border-red-300 text-red-600 text-xs">{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
                    </div>
                  )}
                  {maintenance.status === 'in_progress' && (
                    <Button onClick={() => updateMaintenanceStatus(maintenance.id, 'completed')} size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs mt-3">{language === 'fr' ? 'Terminer' : 'إنهاء'}</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredMaintenances.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default MaintenancePage;
