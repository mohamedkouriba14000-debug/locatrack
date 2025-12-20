import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar, Plus, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReservationsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchReservations(); }, []);
  
  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API}/reservations`, { headers: getAuthHeaders() });
      setReservations(response.data);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
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
          <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white shadow-lg">
            <Plus size={20} className="me-2" /> Nouvelle Réservation
          </Button>
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