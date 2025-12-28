import React, { useEffect, useState, useRef } from 'react';
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
import { Plus, FileText, Edit3, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';
import SignatureCanvas from 'react-signature-canvas';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContractsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const sigCanvas = useRef();
  const [formData, setFormData] = useState({
    client_id: '',
    vehicle_id: '',
    start_date: '',
    end_date: '',
    daily_rate: 0,
    insurance_fee: 0,
    additional_fees: 0
  });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [contractsRes, vehiclesRes, reservationsRes] = await Promise.all([
        axios.get(`${API}/contracts`, { headers: getAuthHeaders() }),
        axios.get(`${API}/vehicles`, { headers: getAuthHeaders() }),
        axios.get(`${API}/reservations`, { headers: getAuthHeaders() }).catch(() => ({ data: [] }))
      ]);
      setContracts(contractsRes.data);
      setVehicles(vehiclesRes.data);
      setReservations(reservationsRes.data.filter(r => r.status === 'confirmed'));
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const contractData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        daily_rate: parseFloat(formData.daily_rate),
        insurance_fee: parseFloat(formData.insurance_fee || 0),
        additional_fees: parseFloat(formData.additional_fees || 0)
      };
      
      await axios.post(`${API}/contracts`, contractData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Contrat créé avec succès' : 'تم إنشاء العقد بنجاح');
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const handleSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error(language === 'fr' ? 'Veuillez signer le contrat' : 'يرجى توقيع العقد');
      return;
    }
    
    try {
      const signatureData = sigCanvas.current.toDataURL();
      await axios.post(`${API}/contracts/${selectedContract}/sign`, { signature_data: signatureData }, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Contrat signé avec succès' : 'تم توقيع العقد بنجاح');
      setShowSignature(false);
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const resetForm = () => {
    setFormData({
      client_id: '',
      vehicle_id: '',
      start_date: '',
      end_date: '',
      daily_rate: 0,
      insurance_fee: 0,
      additional_fees: 0
    });
  };
  
  const handleVehicleSelect = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    setFormData({
      ...formData,
      vehicle_id: vehicleId,
      daily_rate: vehicle?.daily_rate || 0
    });
  };
  
  const getStatusColor = (status) => {
    const colors = { draft: 'from-slate-500 to-slate-600', active: 'from-emerald-500 to-emerald-600', completed: 'from-blue-500 to-blue-600', cancelled: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  const filteredContracts = contracts.filter(c =>
    c.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{t('contracts')}</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> {language === 'fr' ? 'Nouveau Contrat' : 'عقد جديد'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-purple-600 font-heading text-2xl">{language === 'fr' ? 'Nouveau Contrat' : 'عقد جديد'}</DialogTitle>
                <DialogDescription className="text-slate-600">{language === 'fr' ? 'Créer un nouveau contrat de location' : 'إنشاء عقد إيجار جديد'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Véhicule' : 'المركبة'}</Label>
                  <Select value={formData.vehicle_id} onValueChange={handleVehicleSelect}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue placeholder={language === 'fr' ? 'Sélectionner véhicule' : 'اختر مركبة'} /></SelectTrigger>
                    <SelectContent>
                      {vehicles.filter(v => v.status === 'available').map(vehicle => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.make} {vehicle.model} - {vehicle.registration_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'ID Client' : 'معرف العميل'}</Label>
                  <Input value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-purple-500" placeholder="client-id-123" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Date Début' : 'تاريخ البداية'}</Label>
                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Date Fin' : 'تاريخ النهاية'}</Label>
                    <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-purple-500" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Tarif/Jour' : 'السعر/يوم'}</Label>
                    <Input type="number" value={formData.daily_rate} onChange={(e) => setFormData({...formData, daily_rate: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Assurance' : 'التأمين'}</Label>
                    <Input type="number" value={formData.insurance_fee} onChange={(e) => setFormData({...formData, insurance_fee: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Frais Sup.' : 'رسوم إضافية'}</Label>
                    <Input type="number" value={formData.additional_fees} onChange={(e) => setFormData({...formData, additional_fees: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-purple-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">{language === 'fr' ? 'Créer Contrat' : 'إنشاء العقد'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-purple-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{language === 'fr' ? 'Contrat' : 'عقد'} #{contract.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-slate-500">{contract.signed ? '✓ ' + (language === 'fr' ? 'Signé' : 'موقع') : '✏️ ' + (language === 'fr' ? 'Non signé' : 'غير موقع')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Début' : 'البداية'}:</span><span className="font-medium text-slate-800">{new Date(contract.start_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Fin' : 'النهاية'}:</span><span className="font-medium text-slate-800">{new Date(contract.end_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Montant' : 'المبلغ'}:</span><span className="font-bold text-purple-600">{contract.total_amount} DZD</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(contract.status)} text-white text-center font-bold uppercase text-sm`}>{contract.status}</div>
                </div>
                {!contract.signed && contract.status === 'draft' && (
                  <Button onClick={() => { setSelectedContract(contract.id); setShowSignature(true); }} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    <Edit3 size={16} className="me-2" /> {language === 'fr' ? 'Signer Contrat' : 'توقيع العقد'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredContracts.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
        
        {/* Signature Modal */}
        {showSignature && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSignature(false)}>
            <Card className="w-full max-w-2xl m-4 bg-white" onClick={(e) => e.stopPropagation()}>
              <CardHeader><CardTitle className="text-2xl font-bold text-slate-800">✏️ {language === 'fr' ? 'Signer le Contrat' : 'توقيع العقد'}</CardTitle></CardHeader>
              <CardContent>
                <div className="border-4 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
                  <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-64 bg-white rounded-lg', style: { touchAction: 'none' } }} />
                </div>
                <div className="flex gap-3 mt-6">
                  <Button onClick={() => sigCanvas.current?.clear()} variant="outline" className="flex-1 border-2 border-slate-300">{language === 'fr' ? 'Effacer' : 'مسح'}</Button>
                  <Button onClick={handleSign} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">{language === 'fr' ? 'Valider Signature' : 'تأكيد التوقيع'}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ContractsPage;
