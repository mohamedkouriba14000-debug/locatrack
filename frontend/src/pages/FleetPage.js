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
import { Plus, Search, Edit, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

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
    registration_number: '',
    type: 'sedan',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    chassis_number: '',
    color: '',
    insurance_number: '',
    insurance_expiry: '',
    daily_rate: 0,
    gps_device_id: ''
  });
  
  useEffect(() => {
    fetchVehicles();
  }, []);
  
  useEffect(() => {
    const filtered = vehicles.filter(v => 
      v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);
  
  const fetchVehicles = async () => {
    try {
      const response = await axios.get(`${API}/vehicles`, {
        headers: getAuthHeaders()
      });
      setVehicles(response.data);
      setFilteredVehicles(response.data);
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingVehicle) {
        await axios.put(
          `${API}/vehicles/${editingVehicle.id}`,
          formData,
          { headers: getAuthHeaders() }
        );
        toast.success(language === 'fr' ? 'Véhicule modifié' : 'تم تعديل المركبة');
      } else {
        await axios.post(`${API}/vehicles`, formData, {
          headers: getAuthHeaders()
        });
        toast.success(language === 'fr' ? 'Véhicule ajouté' : 'تمت إضافة المركبة');
      }
      
      setShowDialog(false);
      resetForm();
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    }
  };
  
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registration_number: vehicle.registration_number,
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      chassis_number: vehicle.chassis_number,
      color: vehicle.color,
      insurance_number: vehicle.insurance_number || '',
      insurance_expiry: vehicle.insurance_expiry || '',
      daily_rate: vehicle.daily_rate,
      gps_device_id: vehicle.gps_device_id || ''
    });
    setShowDialog(true);
  };
  
  const handleDelete = async (id) => {
    if (!window.confirm(language === 'fr' ? 'Confirmer la suppression?' : 'تأكيد الحذف؟')) return;
    
    try {
      await axios.delete(`${API}/vehicles/${id}`, {
        headers: getAuthHeaders()
      });
      toast.success(language === 'fr' ? 'Véhicule supprimé' : 'تم حذف المركبة');
      fetchVehicles();
    } catch (error) {
      toast.error(t('error'));
    }
  };
  
  const resetForm = () => {
    setEditingVehicle(null);
    setFormData({
      registration_number: '',
      type: 'sedan',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      chassis_number: '',
      color: '',
      insurance_number: '',
      insurance_expiry: '',
      daily_rate: 0,
      gps_device_id: ''
    });
  };
  
  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      rented: 'bg-violet-500/20 text-violet-400 border-violet-500/50',
      maintenance: 'bg-red-500/20 text-red-400 border-red-500/50',
      unavailable: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    };
    return colors[status] || colors.unavailable;
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12" data-testid="fleet-loading">{t('loading')}</div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div data-testid="fleet-page">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-black text-4xl uppercase tracking-tight" data-testid="fleet-title">
            {t('fleet')}
          </h1>
          
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 font-bold" data-testid="add-vehicle-button">
                <Plus size={20} className="me-2" />
                {t('addVehicle')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="vehicle-dialog">
              <DialogHeader>
                <DialogTitle data-testid="dialog-title">
                  {editingVehicle ? t('edit') : t('add')} {t('fleet')}
                </DialogTitle>
                <DialogDescription>
                  {language === 'fr' ? 'Remplissez les informations du véhicule' : 'أدخل معلومات المركبة'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">{t('registrationNumber')}</Label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                      required
                      data-testid="registration-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('type')}</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                      <SelectTrigger data-testid="type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedan">Sedan</SelectItem>
                        <SelectItem value="suv">SUV</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="van">Van</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="make">{t('make')}</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => setFormData({...formData, make: e.target.value})}
                      required
                      data-testid="make-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">{t('model')}</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                      required
                      data-testid="model-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">{t('year')}</Label>
                    <Input
                      id="year"
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                      required
                      data-testid="year-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="color">{t('color')}</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      required
                      data-testid="color-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="chassis_number">{t('chassisNumber')}</Label>
                    <Input
                      id="chassis_number"
                      value={formData.chassis_number}
                      onChange={(e) => setFormData({...formData, chassis_number: e.target.value})}
                      required
                      data-testid="chassis-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">{t('dailyRate')} (DZD)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      value={formData.daily_rate}
                      onChange={(e) => setFormData({...formData, daily_rate: parseFloat(e.target.value)})}
                      required
                      data-testid="daily-rate-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="insurance_number">{t('insuranceNumber')}</Label>
                    <Input
                      id="insurance_number"
                      value={formData.insurance_number}
                      onChange={(e) => setFormData({...formData, insurance_number: e.target.value})}
                      data-testid="insurance-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gps_device_id">GPS Device ID</Label>
                    <Input
                      id="gps_device_id"
                      value={formData.gps_device_id}
                      onChange={(e) => setFormData({...formData, gps_device_id: e.target.value})}
                      data-testid="gps-input"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} data-testid="cancel-button">
                    {t('cancel')}
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700" data-testid="save-button">
                    {t('save')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ps-10 h-12"
              data-testid="search-input"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="vehicles-grid">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-all" data-testid={`vehicle-card-${vehicle.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold" data-testid={`vehicle-name-${vehicle.id}`}>
                      {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <p className="text-sm text-slate-500" data-testid={`vehicle-registration-${vehicle.id}`}>
                      {vehicle.registration_number}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(vehicle.status)}`} data-testid={`vehicle-status-${vehicle.id}`}>
                    {t(vehicle.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('type')}:</span>
                    <span className="font-medium" data-testid={`vehicle-type-${vehicle.id}`}>{vehicle.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('year')}:</span>
                    <span className="font-medium" data-testid={`vehicle-year-${vehicle.id}`}>{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('color')}:</span>
                    <span className="font-medium" data-testid={`vehicle-color-${vehicle.id}`}>{vehicle.color}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('dailyRate')}:</span>
                    <span className="font-bold text-blue-600" data-testid={`vehicle-rate-${vehicle.id}`}>{vehicle.daily_rate} DZD</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  {vehicle.gps_device_id && (
                    <Button variant="outline" size="sm" className="flex-1" data-testid={`gps-button-${vehicle.id}`}>
                      <MapPin size={16} className="me-1" />
                      GPS
                    </Button>
                  )}
                  <Button onClick={() => handleEdit(vehicle)} variant="outline" size="sm" className="flex-1" data-testid={`edit-button-${vehicle.id}`}>
                    <Edit size={16} className="me-1" />
                    {t('edit')}
                  </Button>
                  <Button onClick={() => handleDelete(vehicle.id)} variant="destructive" size="sm" data-testid={`delete-button-${vehicle.id}`}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-slate-500" data-testid="no-vehicles">
            {t('noData')}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FleetPage;