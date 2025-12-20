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
import { Plus, Search, CheckCircle, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ClientsPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { t, language } = useLanguage();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    national_id: '',
    driver_license: '',
    license_expiry: '',
    address: '',
    emergency_contact: ''
  });
  
  useEffect(() => { fetchClients(); }, []);
  
  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
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
      // Pour démo, utiliser l'ID de l'utilisateur actuel
      const clientData = {
        ...formData,
        user_id: user?.id || 'demo-user-id',
        license_expiry: new Date(formData.license_expiry).toISOString()
      };
      
      await axios.post(`${API}/clients`, clientData, { headers: getAuthHeaders() });
      toast.success('Client ajouté avec succès');
      playSyntheticSound('success');
      setShowDialog(false);
      resetForm();
      fetchClients();
    } catch (error) {
      const errorMsg = formatApiError(error);
      toast.error(errorMsg);
      playSyntheticSound('error');
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
      toast.error(formatApiError(error));
      playSyntheticSound('error');
    }
  };
  
  const resetForm = () => {
    setFormData({
      user_id: '',
      national_id: '',
      driver_license: '',
      license_expiry: '',
      address: '',
      emergency_contact: ''
    });
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
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> Ajouter Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-emerald-600 font-heading text-2xl">Nouveau Client</DialogTitle>
                <DialogDescription className="text-slate-600">Informations du client</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Numéro CIN</Label>
                  <Input value={formData.national_id} onChange={(e) => setFormData({...formData, national_id: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-emerald-500" placeholder="123456789012" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Permis de Conduire</Label>
                  <Input value={formData.driver_license} onChange={(e) => setFormData({...formData, driver_license: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-emerald-500" placeholder="DL123456" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Date Expiration Permis</Label>
                  <Input type="date" value={formData.license_expiry} onChange={(e) => setFormData({...formData, license_expiry: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Adresse</Label>
                  <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} onFocus={() => playSyntheticSound('click')} required className="bg-white border-2 border-slate-300 focus:border-emerald-500" placeholder="Alger, Algérie" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Contact Urgence</Label>
                  <Input value={formData.emergency_contact} onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})} onFocus={() => playSyntheticSound('click')} className="bg-white border-2 border-slate-300 focus:border-emerald-500" placeholder="+213555123456" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => { playSyntheticSound('click'); setShowDialog(false); }} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white">Créer Client</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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