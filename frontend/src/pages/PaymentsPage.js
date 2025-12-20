import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { fetchPayments(); }, []);
  
  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API}/payments`, { headers: getAuthHeaders() });
      setPayments(response.data);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(formatApiError(error));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
  };
  
  const getMethodIcon = (method) => {
    const icons = { cib: '💳 CIB', edahabia: '💳 EDAHABIA', cash: '💵 Espèces', check: '📄 Chèque' };
    return icons[method] || method;
  };
  
  const getStatusColor = (status) => {
    const colors = { pending: 'from-orange-500 to-orange-600', completed: 'from-emerald-500 to-emerald-600', failed: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">{t('payments')}</h1>
          <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
            <Plus size={20} className="me-2" /> Enregistrer Paiement
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                    <CreditCard size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">{payment.amount} DZD</CardTitle>
                    <p className="text-sm text-slate-500">{getMethodIcon(payment.method)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Contrat:</span><span className="font-medium text-slate-800">#{payment.contract_id.substring(0, 8)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Date:</span><span className="font-medium text-slate-800">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'En attente'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Référence:</span><span className="font-medium text-slate-800">{payment.reference || '-'}</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(payment.status)} text-white text-center font-bold uppercase text-sm flex items-center justify-center gap-2`}>
                    {payment.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                    {payment.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {payments.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
      </div>
    </Layout>
  );
};

export default PaymentsPage;