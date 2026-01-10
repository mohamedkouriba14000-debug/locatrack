import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Edit, Trash2, MapPin, Car } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FleetPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    plate_number: '', fuel_type: 'essence', brand: '', model: '', year: new Date().getFullYear(),
    transmission: 'manual', color: '', mileage: 0, insurance_expiry: '', 
    technical_inspection_expiry: '', imei: '', daily_rate: 0, status: 'available'
  });
  
  useEffect(() => { fetchVehicles(); }, []);
  useEffect(() => {
    const filtered = vehicles.filter(v => 
      (v.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);
  
  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`, { headers: getAuthHeaders() });
      setVehicles(response.data);
      setFilteredVehicles(response.data);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(formatApiError(error));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year),
        plate_number: formData.plate_number,
        color: formData.color,
        daily_rate: parseFloat(formData.daily_rate) || 0,
        status: formData.status || 'available',
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        mileage: parseInt(formData.mileage) || 0
      };
      
      if (formData.insurance_expiry && formData.insurance_expiry.trim() !== '') {
        submitData.insurance_expiry = formData.insurance_expiry;
      }
      
      if (formData.technical_inspection_expiry && formData.technical_inspection_expiry.trim() !== '') {
        submitData.technical_inspection_expiry = formData.technical_inspection_expiry;
      }
      
      if (formData.imei && formData.imei.trim() !== '') {
        submitData.imei = formData.imei;
      }
      
      if (editingVehicle) {
        await axios.put(`${API}/vehicles/${editingVehicle.id}`, submitData, { headers: getAuthHeaders() });
        toast.success(language === 'fr' ? 'Véhicule modifié' : 'تم تعديل المركبة');
      } else {
        await axios.post(`${API}/vehicles`, submitData, { headers: getAuthHeaders() });
        toast.success(language === 'fr' ? 'Véhicule ajouté' : 'تمت إضافة المركبة');
      }
      setShowDialog(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleEdit = (vehicle) => {
    playSyntheticSound('click');
    setEditingVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number || '', 
      fuel_type: vehicle.fuel_type || 'essence', 
      brand: vehicle.brand || '',
      model: vehicle.model || '', 
      year: vehicle.year || new Date().getFullYear(), 
      transmission: vehicle.transmission || 'manual',
      color: vehicle.color || '', 
      mileage: vehicle.mileage || 0,
      insurance_expiry: vehicle.insurance_expiry ? vehicle.insurance_expiry.split('T')[0] : '', 
      technical_inspection_expiry: vehicle.technical_inspection_expiry ? vehicle.technical_inspection_expiry.split('T')[0] : '',
      imei: vehicle.imei || '',
      daily_rate: vehicle.daily_rate || 0,
      status: vehicle.status || 'available'
    });
    setShowDialog(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression?')) return;
    playSyntheticSound('click');
    try {
      await axios.delete(`${API}/vehicles/${id}`, { headers: getAuthHeaders() });
      toast.success('Véhicule supprimé');
      playSyntheticSound('success');
      fetchVehicles();
    } catch (error) {
      toast.error(formatApiError(error));
      playSyntheticSound('error');
    }
  };
  
  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      plate_number: '', fuel_type: 'essence', brand: '', model: '', year: new Date().getFullYear(),
      transmission: 'manual', color: '', mileage: 0, insurance_expiry: '', 
      technical_inspection_expiry: '', imei: '', daily_rate: 0, status: 'available'
    });
  };
  
  const getStatusColor = (status) => {
    const colors = {
      available: 'from-emerald-500 to-emerald-600 text-white',
      rented: 'from-blue-500 to-blue-600 text-white',
      maintenance: 'from-red-500 to-red-600 text-white',
      unavailable: 'from-slate-500 to-slate-600 text-white'
    };
    return colors[status] || colors.unavailable;
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">{t('fleet')}</h1>
          <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg" data-testid="add-vehicle-btn">
                <Plus size={20} className="me-2" /> {t('addVehicle')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-cyan-600 font-heading text-2xl">{editingVehicle ? t('edit') : t('add')} {t('fleet')}</DialogTitle>
                <DialogDescription className="text-slate-600">Remplissez les informations du véhicule</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Immatriculation' : 'رقم اللوحة'} *</Label>
                    <Input value={formData.plate_number} onChange={(e) => setFormData({...formData, plate_number: e.target.value})} onFocus={() => playSyntheticSound('click')} required placeholder="12345-100-16" className="bg-white border-2 border-slate-300 focus:border-cyan-500" data-testid="plate-number-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Carburant' : 'نوع الوقود'}</Label>
                    <Select value={formData.fuel_type} onValueChange={(value) => { playSyntheticSound('click'); setFormData({...formData, fuel_type: value}); }}>
                      <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essence">Essence</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="hybride">Hybride</SelectItem>
                        <SelectItem value="electrique">Électrique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Marque' : 'العلامة التجارية'} *</Label>
                    <Input value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} onFocus={() => playSyntheticSound('click')} required placeholder="Toyota, Renault..." className="bg-white border-2 border-slate-300 focus:border-cyan-500" data-testid="brand-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{t('model')} *</Label>
                    <Input value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} onFocus={() => playSyntheticSound('click')} required placeholder="Corolla, Clio..." className="bg-white border-2 border-slate-300 focus:border-cyan-500" data-testid="model-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{t('year')} *</Label>
                    <Input type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{t('color')} *</Label>
                    <Input value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} onFocus={() => playSyntheticSound('click')} required placeholder="Blanc, Noir..." className="bg-white border-2 border-slate-300 focus:border-cyan-500" data-testid="color-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Transmission' : 'ناقل الحركة'}</Label>
                    <Select value={formData.transmission} onValueChange={(value) => { playSyntheticSound('click'); setFormData({...formData, transmission: value}); }}>
                      <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuelle</SelectItem>
                        <SelectItem value="automatic">Automatique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Kilométrage' : 'عدد الكيلومترات'}</Label>
                    <Input type="number" value={formData.mileage} onChange={(e) => setFormData({...formData, mileage: parseInt(e.target.value)})} onFocus={() => playSyntheticSound('click')} className="bg-white border-2 border-slate-300 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{t('dailyRate')} (DZD) *</Label>
                    <Input type="number" value={formData.daily_rate} onChange={(e) => setFormData({...formData, daily_rate: parseFloat(e.target.value)})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-cyan-500" data-testid="daily-rate-input" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? "Date Exp. Assurance" : "تاريخ انتهاء التأمين"}</Label>
                    <Input type="date" value={formData.insurance_expiry ? formData.insurance_expiry.split('T')[0] : ''} onChange={(e) => setFormData({...formData, insurance_expiry: e.target.value})} onFocus={() => playSyntheticSound('click')} className="bg-white border-2 border-slate-300 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? "Date Exp. Contrôle Technique" : "تاريخ انتهاء الفحص الفني"}</Label>
                    <Input type="date" value={formData.technical_inspection_expiry ? formData.technical_inspection_expiry.split('T')[0] : ''} onChange={(e) => setFormData({...formData, technical_inspection_expiry: e.target.value})} onFocus={() => playSyntheticSound('click')} className="bg-white border-2 border-slate-300 focus:border-cyan-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? "IMEI Traceur GPS" : "IMEI جهاز تتبع GPS"}</Label>
                    <Input value={formData.imei} onChange={(e) => setFormData({...formData, imei: e.target.value})} onFocus={() => playSyntheticSound('click')} placeholder="353701097887430" className="bg-white border-2 border-slate-300 focus:border-cyan-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { playSyntheticSound('click'); setShowDialog(false); }} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white" data-testid="submit-vehicle-btn">{t('save')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => playSyntheticSound('click')} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-cyan-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg" data-testid={`vehicle-card-${vehicle.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full">
                      <Car size={24} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">{vehicle.brand} {vehicle.model}</CardTitle>
                      <p className="text-sm text-slate-500">{vehicle.plate_number}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getStatusColor(vehicle.status)} text-xs font-bold uppercase shadow-md`}>{t(vehicle.status)}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Carburant' : 'الوقود'}:</span><span className="font-medium text-slate-800 capitalize">{vehicle.fuel_type || '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{t('year')}:</span><span className="font-medium text-slate-800">{vehicle.year}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{t('color')}:</span><span className="font-medium text-slate-800">{vehicle.color}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{t('dailyRate')}:</span><span className="font-bold text-cyan-600">{vehicle.daily_rate} DZD</span></div>
                </div>
                <div className="flex gap-2 mt-4">
                  {vehicle.imei && (
                    <Button onClick={() => playSyntheticSound('click')} variant="outline" size="sm" className="flex-1 border-2 border-blue-300 text-blue-600 hover:bg-blue-50">
                      <MapPin size={16} className="me-1" /> GPS
                    </Button>
                  )}
                  <Button onClick={() => handleEdit(vehicle)} variant="outline" size="sm" className="flex-1 border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50" data-testid={`edit-vehicle-${vehicle.id}`}>
                    <Edit size={16} className="me-1" /> {t('edit')}
                  </Button>
                  <Button onClick={() => handleDelete(vehicle.id)} variant="destructive" size="sm" className="bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100" data-testid={`delete-vehicle-${vehicle.id}`}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredVehicles.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default FleetPage;
