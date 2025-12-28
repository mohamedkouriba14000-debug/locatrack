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
import { Plus, CreditCard, CheckCircle, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t, language } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    contract_id: '',
    amount: '',
    method: 'cash',
    reference: ''
  });
  
  useEffect(() => { fetchData(); }, []);
  
  const fetchData = async () => {
    try {
      const [paymentsRes, contractsRes] = await Promise.all([
        axios.get(`${API}/payments`, { headers: getAuthHeaders() }),
        axios.get(`${API}/contracts`, { headers: getAuthHeaders() })
      ]);
      setPayments(paymentsRes.data);
      setContracts(contractsRes.data.filter(c => c.status === 'active'));
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };
      
      await axios.post(`${API}/payments`, paymentData, { headers: getAuthHeaders() });
      toast.success(language === 'fr' ? 'Paiement enregistré' : 'تم تسجيل الدفع');
      setShowDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(formatApiError(error));
    }
  };
  
  const resetForm = () => {
    setFormData({
      contract_id: '',
      amount: '',
      method: 'cash',
      reference: ''
    });
  };
  
  const handleContractSelect = (contractId) => {
    const contract = contracts.find(c => c.id === contractId);
    setFormData({
      ...formData,
      contract_id: contractId,
      amount: contract?.total_amount || ''
    });
  };
  
  const getMethodIcon = (method) => {
    const icons = { cib: '💳 CIB', edahabia: '💳 EDAHABIA', cash: '💵 ' + (language === 'fr' ? 'Espèces' : 'نقدي'), check: '📄 ' + (language === 'fr' ? 'Chèque' : 'شيك') };
    return icons[method] || method;
  };
  
  const getStatusColor = (status) => {
    const colors = { pending: 'from-orange-500 to-orange-600', completed: 'from-emerald-500 to-emerald-600', failed: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  const filteredPayments = payments.filter(p =>
    p.contract_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate totals
  const totalAmount = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">{t('payments')}</h1>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                <Plus size={20} className="me-2" /> {language === 'fr' ? 'Enregistrer Paiement' : 'تسجيل دفعة'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-white border-2 border-slate-200">
              <DialogHeader>
                <DialogTitle className="text-green-600 font-heading text-2xl">{language === 'fr' ? 'Nouveau Paiement' : 'دفعة جديدة'}</DialogTitle>
                <DialogDescription className="text-slate-600">{language === 'fr' ? 'Enregistrer un nouveau paiement' : 'تسجيل دفعة جديدة'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Contrat' : 'العقد'}</Label>
                  <Select value={formData.contract_id} onValueChange={handleContractSelect}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue placeholder={language === 'fr' ? 'Sélectionner contrat' : 'اختر عقد'} /></SelectTrigger>
                    <SelectContent>
                      {contracts.map(contract => (
                        <SelectItem key={contract.id} value={contract.id}>{language === 'fr' ? 'Contrat' : 'عقد'} #{contract.id.substring(0, 8)} - {contract.total_amount} DZD</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Montant (DZD)' : 'المبلغ (دج)'}</Label>
                  <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required className="bg-white border-2 border-slate-300 focus:border-green-500" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Méthode de paiement' : 'طريقة الدفع'}</Label>
                  <Select value={formData.method} onValueChange={(value) => setFormData({...formData, method: value})}>
                    <SelectTrigger className="bg-white border-2 border-slate-300"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">💵 {language === 'fr' ? 'Espèces' : 'نقدي'}</SelectItem>
                      <SelectItem value="cib">💳 CIB</SelectItem>
                      <SelectItem value="edahabia">💳 EDAHABIA</SelectItem>
                      <SelectItem value="check">📄 {language === 'fr' ? 'Chèque' : 'شيك'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">{language === 'fr' ? 'Référence (optionnel)' : 'المرجع (اختياري)'}</Label>
                  <Input value={formData.reference} onChange={(e) => setFormData({...formData, reference: e.target.value})} className="bg-white border-2 border-slate-300 focus:border-green-500" placeholder="REF-123456" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="border-2 border-slate-300">{t('cancel')}</Button>
                  <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white">{language === 'fr' ? 'Enregistrer' : 'تسجيل'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Stats Card */}
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">{language === 'fr' ? 'Total Encaissé' : 'إجمالي المحصل'}</p>
                <p className="text-3xl font-bold text-green-800">{totalAmount.toLocaleString()} DZD</p>
              </div>
              <CreditCard className="text-green-500" size={48} />
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input placeholder={t('search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10 h-12 bg-white border-2 border-slate-300 focus:border-green-500" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                    <CreditCard size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{payment.amount.toLocaleString()} DZD</CardTitle>
                    <p className="text-sm text-slate-500">{getMethodIcon(payment.method)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Contrat' : 'العقد'}:</span><span className="font-medium text-slate-800">#{payment.contract_id.substring(0, 8)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Date' : 'التاريخ'}:</span><span className="font-medium text-slate-800">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : (language === 'fr' ? 'En attente' : 'في الانتظار')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">{language === 'fr' ? 'Référence' : 'المرجع'}:</span><span className="font-medium text-slate-800">{payment.reference || '-'}</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(payment.status)} text-white text-center font-bold uppercase text-sm flex items-center justify-center gap-2`}>
                    {payment.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                    {payment.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredPayments.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default PaymentsPage;
