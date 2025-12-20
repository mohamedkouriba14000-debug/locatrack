import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileText, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { playSyntheticSound } from '../utils/sounds';
import SignatureCanvas from 'react-signature-canvas';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContractsPage = () => {
  const { getAuthHeaders } = useAuth();
  const { t } = useLanguage();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const sigCanvas = useRef();
  
  useEffect(() => { fetchContracts(); }, []);
  
  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API}/contracts`, { headers: getAuthHeaders() });
      setContracts(response.data);
      playSyntheticSound('success');
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSign = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Veuillez signer le contrat');
      playSyntheticSound('error');
      return;
    }
    
    playSyntheticSound('click');
    try {
      const signatureData = sigCanvas.current.toDataURL();
      await axios.post(`${API}/contracts/${selectedContract}/sign`, { signature_data: signatureData }, { headers: getAuthHeaders() });
      toast.success('Contrat signé avec succès');
      playSyntheticSound('success');
      setShowSignature(false);
      fetchContracts();
    } catch (error) {
      toast.error(t('error'));
      playSyntheticSound('error');
    }
  };
  
  const getStatusColor = (status) => {
    const colors = { draft: 'from-slate-500 to-slate-600', active: 'from-emerald-500 to-emerald-600', completed: 'from-blue-500 to-blue-600', cancelled: 'from-red-500 to-red-600' };
    return colors[status] || 'from-slate-500 to-slate-600';
  };
  
  if (loading) return <Layout><div className="text-center py-12">{t('loading')}</div></Layout>;
  
  return (
    <Layout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading font-bold text-4xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{t('contracts')}</h1>
          <Button onClick={() => playSyntheticSound('click')} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg">
            <Plus size={20} className="me-2" /> Nouveau Contrat
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => (
            <Card key={contract.id} className="bg-white border-2 border-slate-200 card-hover shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                    <FileText size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Contrat #{contract.id.substring(0, 8)}</CardTitle>
                    <p className="text-sm text-slate-500">{contract.signed ? '✓ Signé' : '✏️ Non signé'}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Début:</span><span className="font-medium text-slate-800">{new Date(contract.start_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Fin:</span><span className="font-medium text-slate-800">{new Date(contract.end_date).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Montant:</span><span className="font-bold text-purple-600">{contract.total_amount} DZD</span></div>
                  <div className={`mt-3 px-3 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(contract.status)} text-white text-center font-bold uppercase text-sm`}>{contract.status}</div>
                </div>
                {!contract.signed && contract.status === 'draft' && (
                  <Button onClick={() => { setSelectedContract(contract.id); setShowSignature(true); playSyntheticSound('click'); }} className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    <Edit3 size={16} className="me-2" /> Signer Contrat
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {contracts.length === 0 && <div className="text-center py-12 text-slate-500">{t('noData')}</div>}
        
        {/* Signature Modal */}
        {showSignature && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSignature(false)}>
            <Card className="w-full max-w-2xl m-4 bg-white" onClick={(e) => e.stopPropagation()}>
              <CardHeader><CardTitle className="text-2xl font-bold text-slate-800">✏️ Signer le Contrat</CardTitle></CardHeader>
              <CardContent>
                <div className="border-4 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
                  <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-64 bg-white rounded-lg', style: { touchAction: 'none' } }} />
                </div>
                <div className="flex gap-3 mt-6">
                  <Button onClick={() => sigCanvas.current?.clear()} variant="outline" className="flex-1 border-2 border-slate-300">Effacer</Button>
                  <Button onClick={handleSign} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">Valider Signature</Button>
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