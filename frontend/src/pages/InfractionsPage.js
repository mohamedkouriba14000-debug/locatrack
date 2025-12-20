import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, AlertTriangle, Car } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InfractionsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [infractions, setInfractions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchInfractions(); }, []);
  
  const fetchInfractions = async () => {
    try {
      const response = await axios.get(`${API}/infractions`, { headers: getAuthHeaders() });
      setInfractions(response.data);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    const colors = { pending: 'from-orange-500 to-orange-600', paid: 'from-emerald-500 to-emerald-600', disputed: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600">{t('infractions')}</h1>
          <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg">
            <Plus size={20} className="me-2" /> Ajouter Infraction
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {infractions.map((infraction) => (
            <Card key={infraction.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-full">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{infraction.type}</CardTitle>
                    <p className="text-sm text-slate-500">{new Date(infraction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Car size={16} className="text-slate-400" /><span className="text-slate-600">Véhicule:</span><span className="font-medium text-slate-800">#{infraction.vehicle_id.substring(0, 8)}</span></div>
                  <div className="p-2 bg-slate-50 rounded-lg"><p className="text-slate-600">{infraction.description}</p></div>
                  <div className="flex justify-between"><span className="text-slate-600">Montant:</span><span className="font-bold text-red-600">{infraction.amount} DZD</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Payé par:</span><span className="font-medium text-slate-800">{infraction.paid_by || 'Non défini'}</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(infraction.status)} text-white text-center font-bold uppercase text-sm`}>{infraction.status}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {infractions.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default InfractionsPage;