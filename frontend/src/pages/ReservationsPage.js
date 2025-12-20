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
import { Calendar, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReservationsPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { t, language } = useLanguage();
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    notes: ''
  });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [resRes, vehRes, cliRes] = await Promise.all([
        axios.get(`${API}/reservations`, { headers: getAuthHeaders() }),
        axios.get(`${API}/vehicles`, { headers: getAuthHeaders() }),
        axios.get(`${API}/clients`, { headers: getAuthHeaders() }).catch(() => ({ data: [] }))
      ]);
      setReservations(resRes.data);
      setVehicles(vehRes.data.filter(v => v.status === 'available'));
      setClients(cliRes.data);
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
    playSyntheticSound('click');
    try {
      const reservationData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      };
      
      await axios.post(`${API}/reservations`, reservationData, { headers: getAuthHeaders() });
      toast.success('Réservation créée avec succès');
      playSyntheticSound('success');
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
      playSyntheticSound('error');
    }
  };
  
  const resetForm = () => {
    setFormData({
      client_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      notes: ''
    });
  };
  
  const getStatusColor = (status) => {
    const colors = { pending: 'from-orange-500 to-orange-600', confirmed: 'from-emerald-500 to-emerald-600', cancelled: 'from-red-500 to-red-600', completed: 'from-blue-500 to-blue-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">{t('reservations')}</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> Nouvelle Réservation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-blue-600 font-heading text-2xl">Nouvelle Réservation</DialogTitle>
                <DialogDescription className="text-slate-600">Créer une nouvelle réservation</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Client</Label>
                  <Select value={formData.client_id} onValueChange={(value) => { playSyntheticSound('click'); setFormData({...formData, client_id: value}); }}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue placeholder="Sélectionner client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>Client #{client.id.substring(0, 8)} - {client.national_id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Véhicule</Label>
                  <Select value={formData.vehicle_id} onValueChange={(value) => { playSyntheticSound('click'); setFormData({...formData, vehicle_id: value}); }}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue placeholder="Sélectionner véhicule" /></SelectTrigger>
                    <SelectContent>
                      {vehicles.map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} - {vehicle.registration_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Date Début</Label>
                  <Input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Date Fin</Label>
                  <Input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Notes</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} onFocus={() => playSyntheticSound('click')} className="bg-white border-2 border-slate-300 focus:border-blue-500" placeholder="Notes optionnelles..." />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { playSyntheticSound('click'); setShowDialog(false); }} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white">Créer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full">
                    <Calendar size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Réservation #{reservation.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-slate-500">Véhicule: {reservation.vehicle_id.substring(0, 8)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-slate-400" /><span className="text-slate-600">Du:</span><span className="font-medium text-slate-800">{new Date(reservation.start_date).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-2 text-sm"><Clock size={16} className="text-slate-400" /><span className="text-slate-600">Au:</span><span className="font-medium text-slate-800">{new Date(reservation.end_date).toLocaleDateString()}</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(reservation.status)} text-white text-center font-bold uppercase text-sm`}>{reservation.status}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {reservations.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default ReservationsPage;
