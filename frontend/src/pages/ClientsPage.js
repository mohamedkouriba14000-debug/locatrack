import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchClients(); }, []);
  
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (id) => {
    playSyntheticSound('click');
    try {
      await axios.put(`${API}/clients/${id}/verify`, {}, { headers: getAuthHeaders() });
      toast.success('Client vérifié');
      playSyntheticSound('success');
      fetchClients();
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    }
  };
  
  const filteredClients = clients.filter(c => 
    c.national_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.driver_license?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">{t('clients')}</h1>
          <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg">
            <Plus size={20} className="me-2" /> Ajouter Client
          </Button>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onFocus={() => playSyntheticSound('click')} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-emerald-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full">
                      <User size={24} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">Client #{client.id.substring(0, 8)}</CardTitle>
                      <p className="text-sm text-slate-500">CIN: {client.national_id}</p>
                    </div>
                  </div>
                  {client.verified ? <CheckCircle className="text-emerald-500" size={24} /> : <XCircle className="text-slate-400" size={24} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Permis:</span><span className="font-medium text-slate-800">{client.driver_license}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Expiration:</span><span className="font-medium text-slate-800">{new Date(client.license_expiry).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Statut:</span><span className={`font-bold ${client.verified ? 'text-emerald-600' : 'text-orange-600'}`}>{client.verified ? '✓ Vérifié' : '⏳ En attente'}</span></div>
                </div>
                {!client.verified && (
                  <Button onClick={() => handleVerify(client.id)} className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">Vérifier Client</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredClients.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default ClientsPage;