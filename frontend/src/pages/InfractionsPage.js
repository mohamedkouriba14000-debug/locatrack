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
import { Plus, AlertTriangle, Car, Search, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InfractionsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [infractions, setInfractions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    vehicle_id: '',
    type: 'speeding',
    description: '',
    amount: '',
    date: '',
    location: '',
    paid_by: 'company'
  });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [infractionsRes, vehiclesRes] = await Promise.all([
        axios.get(`${API}/infractions`, { headers: getAuthHeaders() }),
        axios.get(`${API}/vehicles`, { headers: getAuthHeaders() })
      ]);
      setInfractions(infractionsRes.data);
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
      const infractionData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        amount: parseFloat(formData.amount)
      };
      
      await axios.post(`${API}/infractions`, infractionData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Infraction enregistrée' : 'تم تسجيل المخالفة');
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const markAsPaid = async (infractionId) => {
    try {
      await axios.put(`${API}/infractions/${infractionId}`, { status: 'paid' }, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Infraction marquée comme payée' : 'تم وضع علامة على المخالفة كمدفوعة');
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      type: 'speeding',
      description: '',
      amount: '',
      date: '',
      location: '',
      paid_by: 'company'
    });
  };
  
  const getStatusColor = (status) => {
    const colors = { pending: 'from-orange-500 to-orange-600', paid: 'from-emerald-500 to-emerald-600', disputed: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : vehicleId?.substring(0, 8);
  };
  
  const getInfractionTypeLabel = (type) => {
    const types = {
      speeding: language === 'fr' ? '🚗 Excès de vitesse' : '🚗 تجاوز السرعة',
      parking: language === 'fr' ? '🅿️ Stationnement' : '🅿️ موقف سيارات',
      red_light: language === 'fr' ? '🚦 Feu rouge' : '🚦 ضوء أحمر',
      other: language === 'fr' ? '📋 Autre' : '📋 أخرى'
    };
    return types[type] || type;
  };
  
  const filteredInfractions = infractions.filter(i =>
    i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate totals
  const totalPending = infractions.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = infractions.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">{t('infractions')}</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> {language === 'fr' ? 'Ajouter Infraction' : 'إضافة مخالفة'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-red-600 font-heading text-2xl">{language === 'fr' ? 'Nouvelle Infraction' : 'مخالفة جديدة'}</DialogTitle>
                <DialogDescription className="text-slate-600">{language === 'fr' ? 'Enregistrer une infraction' : 'تسجيل مخالفة'}</DialogDescription>
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
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Type d\'infraction' : 'نوع المخالفة'}</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="speeding">🚗 {language === 'fr' ? 'Excès de vitesse' : 'تجاوز السرعة'}</SelectItem>
                      <SelectItem value="parking">🅿️ {language === 'fr' ? 'Stationnement' : 'موقف سيارات'}</SelectItem>
                      <SelectItem value="red_light">🚦 {language === 'fr' ? 'Feu rouge' : 'ضوء أحمر'}</SelectItem>
                      <SelectItem value="other">📋 {language === 'fr' ? 'Autre' : 'أخرى'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Description' : 'الوصف'}</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-red-500" placeholder={language === 'fr' ? 'Détails de l\'infraction...' : 'تفاصيل المخالفة...'} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Montant (DZD)' : 'المبلغ (دج)'}</Label>
                    <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-red-500" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Date' : 'التاريخ'}</Label>
                    <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-red-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Lieu' : 'الموقع'}</Label>
                  <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-red-500" placeholder={language === 'fr' ? 'Adresse ou lieu...' : 'العنوان أو الموقع...'} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Payé par' : 'المدفوع من قبل'}</Label>
                  <Select value={formData.paid_by} onValueChange={(value) => setFormData({...formData, paid_by: value})}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">🏢 {language === 'fr' ? 'Entreprise' : 'الشركة'}</SelectItem>
                      <SelectItem value="client">👤 {language === 'fr' ? 'Client' : 'العميل'}</SelectItem>
                      <SelectItem value="driver">🚗 {language === 'fr' ? 'Conducteur' : 'السائق'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white">{language === 'fr' ? 'Enregistrer' : 'تسجيل'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">{language === 'fr' ? 'En Attente' : 'في الانتظار'}</p>
                  <p className="text-3xl font-bold text-orange-800">{totalPending.toLocaleString()} DZD</p>
                </div>
                <AlertTriangle className="text-orange-500" size={48} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 font-medium">{language === 'fr' ? 'Payées' : 'مدفوعة'}</p>
                  <p className="text-3xl font-bold text-emerald-800">{totalPaid.toLocaleString()} DZD</p>
                </div>
                <CheckCircle className="text-emerald-500" size={48} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-red-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInfractions.map((infraction) => (
            <Card key={infraction.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-full">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{getInfractionTypeLabel(infraction.type)}</CardTitle>
                    <p className="text-sm text-slate-500">{new Date(infraction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Car size={16} className="text-slate-400" /><span className="text-slate-600">{language === 'fr' ? 'Véhicule' : 'مركبة'}:</span><span className="font-medium text-slate-800">{getVehicleName(infraction.vehicle_id)}</span></div>
                  {infraction.location && <div className="text-slate-600 text-xs">📍 {infraction.location}</div>}
                  <div className="p-2 bg-slate-50 rounded-lg"><p className="text-slate-600">{infraction.description}</p></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Montant' : 'المبلغ'}:</span><span className="font-bold text-red-600">{infraction.amount?.toLocaleString()} DZD</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Payé par' : 'المدفوع من قبل'}:</span><span className="font-medium text-slate-800">{infraction.paid_by || (language === 'fr' ? 'Non défini' : 'غير محدد')}</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(infraction.status)} text-white text-center font-bold uppercase text-sm`}>{infraction.status}</div>
                  
                  {infraction.status === 'pending' && (
                    <Button onClick={() => markAsPaid(infraction.id)} size="sm" className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 text-white">
                      <CheckCircle size={16} className="me-2" /> {language === 'fr' ? 'Marquer comme payée' : 'وضع علامة كمدفوعة'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredInfractions.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default InfractionsPage;
