import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Printer, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ContractPrintPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { language } = useLanguage();
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignature, setShowSignature] = useState(false);
  const sigCanvasClient = useRef();
  const sigCanvasAgent = useRef();
  const [signatures, setSignatures] = useState({ client: null, agent: null });
  
  // Vehicle inspection state
  const [inspection, setInspection] = useState({
    fuelLevel: '1/2',
    frontTires: 'bon',
    rearTires: 'bon',
    tools: true,
    spareTire: true,
    damages: {},
    accessories: '',
    observations: ''
  });
  
  useEffect(() => {
    if (contractId) {
      fetchContractData();
    }
  }, [contractId]);
  
  const fetchContractData = async () => {
    try {
      const [contractRes, vehiclesRes, clientsRes] = await Promise.all([
        axios.get(`${API}/contracts/${contractId}`, { headers: getAuthHeaders() }).catch(() => null),
        axios.get(`${API}/vehicles`, { headers: getAuthHeaders() }),
        axios.get(`${API}/clients`, { headers: getAuthHeaders() })
      ]);
      
      if (contractRes?.data) {
        setContract(contractRes.data);
        const v = vehiclesRes.data.find(v => v.id === contractRes.data.vehicle_id);
        const c = clientsRes.data.find(c => c.id === contractRes.data.client_id);
        setVehicle(v);
        setClient(c);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du contrat');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const saveSignature = (type) => {
    const canvas = type === 'client' ? sigCanvasClient.current : sigCanvasAgent.current;
    if (canvas && !canvas.isEmpty()) {
      const dataUrl = canvas.toDataURL();
      setSignatures(prev => ({ ...prev, [type]: dataUrl }));
      toast.success(language === 'fr' ? 'Signature enregistrée' : 'تم حفظ التوقيع');
    }
  };
  
  const clearSignature = (type) => {
    const canvas = type === 'client' ? sigCanvasClient.current : sigCanvasAgent.current;
    if (canvas) {
      canvas.clear();
      setSignatures(prev => ({ ...prev, [type]: null }));
    }
  };
  
  const toggleDamage = (part, side) => {
    const key = `${side}_${part}`;
    setInspection(prev => ({
      ...prev,
      damages: {
        ...prev.damages,
        [key]: prev.damages[key] ? undefined : 'X'
      }
    }));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
      </div>
    );
  }
  
  const today = new Date();
  const formatDate = (date) => {
    if (!date) return '____/____/________';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR');
  };
  
  // Parts list for vehicle inspection
  const leftParts = [
    'Capot', 'Calandre', 'Phare', 'Clignotants', 'Pare-chocs', 
    'Passage de roues', 'Pare-Brise', 'Pavillon', 'Partie latérale Gauche',
    'Aile AV', 'Porte AV', 'Porte AR', 'Panneau-Caisse', 'Aile AR', 
    'Bas de Caisse', 'Rétroviseur(s)'
  ];
  
  const rightParts = [
    'Feux', 'Hayon', 'Porte de malle', 'Jupe', 'Plancher',
    'Passage de roues', 'Pare-chocs', 'Partie latérale Droite',
    'Aile AV', 'Porte AV', 'Porte AR', 'Panneau-Caisse', 'Aile AR',
    'Bas de Caisse', 'Montants', 'Rétroviseur(s)'
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 p-4 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} className="me-2" />
            {language === 'fr' ? 'Retour' : 'رجوع'}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSignature(!showSignature)}
              className="border-cyan-300 text-cyan-600"
            >
              {showSignature ? 'Masquer signatures' : 'Ajouter signatures'}
            </Button>
            <Button onClick={handlePrint} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <Printer size={20} className="me-2" />
              {language === 'fr' ? 'Imprimer' : 'طباعة'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Signature Panel - Hidden when printing */}
      {showSignature && (
        <div className="print:hidden max-w-4xl mx-auto p-4">
          <Card className="bg-white border-2 border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Signatures numériques</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-medium mb-2">Signature Client</p>
                  <div className="border-2 border-slate-300 rounded-lg bg-white">
                    <SignatureCanvas
                      ref={sigCanvasClient}
                      canvasProps={{ className: 'w-full h-32' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => clearSignature('client')}>Effacer</Button>
                    <Button size="sm" onClick={() => saveSignature('client')}>
                      <CheckCircle size={16} className="me-1" /> Valider
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-2">Signature Agent</p>
                  <div className="border-2 border-slate-300 rounded-lg bg-white">
                    <SignatureCanvas
                      ref={sigCanvasAgent}
                      canvasProps={{ className: 'w-full h-32' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => clearSignature('agent')}>Effacer</Button>
                    <Button size="sm" onClick={() => saveSignature('agent')}>
                      <CheckCircle size={16} className="me-1" /> Valider
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Contract Document */}
      <div className="max-w-4xl mx-auto p-4 print:p-0 print:max-w-none">
        <div className="bg-white shadow-lg print:shadow-none" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header */}
          <div className="border-2 border-black p-4">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold">CONTRAT DE LOCATION</h1>
                <h2 className="text-lg font-bold">DE VÉHICULE</h2>
                <div className="mt-4 space-y-1">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" /> <span className="italic">Particulier</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4" /> <span className="italic">Utilitaire</span>
                  </label>
                </div>
              </div>
              <div className="border border-black p-4 w-48 text-center">
                <p className="font-bold text-sm">LOUEUR</p>
                <p className="mt-2 text-sm font-medium">{user?.company_name || 'LocaTrack'}</p>
                <p className="text-xs text-slate-600">{user?.phone}</p>
              </div>
            </div>
            
            {/* Client & Vehicle Info */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {/* Client Section */}
              <div className="border border-black">
                <div className="bg-slate-200 p-1 text-center font-bold text-sm">CLIENT</div>
                <div className="p-2 text-sm space-y-1">
                  <p>Nom : <span className="border-b border-dotted border-black inline-block w-48">{client?.full_name || '_____________'}</span></p>
                  <p>Prénom : <span className="border-b border-dotted border-black inline-block w-44">_____________</span></p>
                  <p>N° et rue : <span className="border-b border-dotted border-black inline-block w-44">{client?.address || '_____________'}</span></p>
                  <p>Code Postal : <span className="border-b border-dotted border-black inline-block w-20">_____</span> Ville : <span className="border-b border-dotted border-black inline-block w-24">_______</span></p>
                  <p>Tél : <span className="border-b border-dotted border-black inline-block w-32">{client?.phone || '_____________'}</span></p>
                  <p>Permis n° : <span className="border-b border-dotted border-black inline-block w-28">{client?.license_number || '________'}</span> délivré à : <span className="border-b border-dotted border-black inline-block w-20">______</span> le : <span className="border-b border-dotted border-black inline-block w-20">{client?.license_issue_date ? formatDate(client.license_issue_date) : '______'}</span></p>
                </div>
              </div>
              
              {/* Vehicle Section */}
              <div className="border border-black">
                <div className="bg-slate-200 p-1 text-center font-bold text-sm">VÉHICULE</div>
                <div className="p-2 text-sm space-y-1">
                  <p>N° immatriculation : <span className="border-b border-dotted border-black inline-block w-32">{vehicle?.registration_number || '_____________'}</span></p>
                  <p>1ère mise en circulation : <span className="border-b border-dotted border-black inline-block w-24">{vehicle?.year || '______'}</span></p>
                  <p>marque : <span className="border-b border-dotted border-black inline-block w-40">{vehicle?.make || '_____________'}</span></p>
                  <p>modèle : <span className="border-b border-dotted border-black inline-block w-40">{vehicle?.model || '_____________'}</span></p>
                  <p>N° de série : <span className="border-b border-dotted border-black inline-block w-40">{vehicle?.chassis_number || '_____________'}</span></p>
                  <p>Km au compteur : <span className="border-b border-dotted border-black inline-block w-32">_____________</span></p>
                </div>
              </div>
            </div>
            
            {/* Duration & Mileage */}
            <div className="mt-4 border border-black p-2">
              <p className="font-bold text-sm">DURÉE - KILOMÉTRAGE</p>
              <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                <p>DÉPART le <span className="border-b border-dotted border-black inline-block w-24">{contract?.start_date ? formatDate(contract.start_date) : '________'}</span> à <span className="border-b border-dotted border-black inline-block w-16">____</span> h</p>
                <p>RETOUR le <span className="border-b border-dotted border-black inline-block w-24">{contract?.end_date ? formatDate(contract.end_date) : '________'}</span> à <span className="border-b border-dotted border-black inline-block w-16">____</span> h</p>
              </div>
              <p className="text-sm mt-2">PROLONGATION au : <span className="border-b border-dotted border-black inline-block w-40">_____________</span></p>
            </div>
            
            {/* Vehicle Inspection Diagram */}
            <div className="mt-4 border border-black">
              <div className="grid grid-cols-3">
                {/* Left Parts */}
                <div className="border-e border-black">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border-b border-black p-1 text-left">Partie AV</th>
                        <th className="border-b border-black p-1 w-12">Rayure</th>
                        <th className="border-b border-black p-1 w-10">Choc</th>
                        <th className="border-b border-black p-1 w-10">HS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leftParts.map((part, i) => (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="p-1 text-xs">{part}</td>
                          <td className="border-s border-slate-200 text-center cursor-pointer hover:bg-slate-100" onClick={() => toggleDamage(part, 'left_rayure')}>{inspection.damages[`left_rayure_${part}`] || ''}</td>
                          <td className="border-s border-slate-200 text-center cursor-pointer hover:bg-slate-100" onClick={() => toggleDamage(part, 'left_choc')}>{inspection.damages[`left_choc_${part}`] || ''}</td>
                          <td className="border-s border-slate-200 text-center cursor-pointer hover:bg-slate-100" onClick={() => toggleDamage(part, 'left_hs')}>{inspection.damages[`left_hs_${part}`] || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Center - Vehicle Diagram */}
                <div className="flex flex-col items-center justify-center p-4 border-e border-black">
                  <div className="text-center">
                    {/* Simple car diagram representation */}
                    <svg viewBox="0 0 200 300" className="w-32 h-48 mx-auto">
                      {/* Car body outline */}
                      <rect x="40" y="60" width="120" height="180" rx="20" fill="none" stroke="black" strokeWidth="2"/>
                      {/* Windshield */}
                      <path d="M 50 90 L 60 60 L 140 60 L 150 90" fill="none" stroke="black" strokeWidth="1.5"/>
                      {/* Rear window */}
                      <path d="M 50 210 L 60 240 L 140 240 L 150 210" fill="none" stroke="black" strokeWidth="1.5"/>
                      {/* Front wheels */}
                      <ellipse cx="50" cy="100" rx="15" ry="8" fill="none" stroke="black" strokeWidth="2"/>
                      <ellipse cx="150" cy="100" rx="15" ry="8" fill="none" stroke="black" strokeWidth="2"/>
                      {/* Rear wheels */}
                      <ellipse cx="50" cy="200" rx="15" ry="8" fill="none" stroke="black" strokeWidth="2"/>
                      <ellipse cx="150" cy="200" rx="15" ry="8" fill="none" stroke="black" strokeWidth="2"/>
                      {/* Doors */}
                      <line x1="40" y1="130" x2="160" y2="130" stroke="black" strokeWidth="1"/>
                      <line x1="40" y1="170" x2="160" y2="170" stroke="black" strokeWidth="1"/>
                    </svg>
                    
                    {/* Fuel Level */}
                    <div className="mt-4">
                      <p className="text-xs font-semibold">Niveau de carburant :</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        {['0', '1/4', '1/2', '3/4', '4/4'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setInspection(prev => ({ ...prev, fuelLevel: level }))}
                            className={`px-2 py-1 text-xs border rounded ${inspection.fuelLevel === level ? 'bg-cyan-500 text-white' : 'bg-white'}`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Parts */}
                <div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border-b border-black p-1 text-left">Partie AR</th>
                        <th className="border-b border-black p-1 w-12">Rayure</th>
                        <th className="border-b border-black p-1 w-10">Choc</th>
                        <th className="border-b border-black p-1 w-10">HS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rightParts.map((part, i) => (
                        <tr key={i} className="border-b border-slate-200">
                          <td className="p-1 text-xs">{part}</td>
                          <td className="border-s border-slate-200 text-center cursor-pointer hover:bg-slate-100" onClick={() => toggleDamage(part, 'right_rayure')}>{inspection.damages[`right_rayure_${part}`] || ''}</td>
                          <td className="border-s border-slate-200 text-center cursor-pointer hover:bg-slate-100" onClick={() => toggleDamage(part, 'right_choc')}>{inspection.damages[`right_choc_${part}`] || ''}</td>
                          <td className="border-s border-slate-200 text-center cursor-pointer hover:bg-slate-100" onClick={() => toggleDamage(part, 'right_hs')}>{inspection.damages[`right_hs_${part}`] || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Legend */}
              <div className="p-2 text-xs border-t border-black">
                <p className="text-center">- : rayure / O : tôlerie / X : remplacement</p>
              </div>
            </div>
            
            {/* Tires & Equipment */}
            <div className="mt-2 text-sm space-y-1 border border-black p-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p>Pneu avants : 
                    <label className="ms-2"><input type="checkbox" checked={inspection.frontTires === 'bon'} onChange={() => setInspection(p => ({...p, frontTires: 'bon'}))} /> Bon</label>
                    <label className="ms-2"><input type="checkbox" checked={inspection.frontTires === 'moyen'} onChange={() => setInspection(p => ({...p, frontTires: 'moyen'}))} /> Moyen</label>
                    <label className="ms-2"><input type="checkbox" checked={inspection.frontTires === 'mauvais'} onChange={() => setInspection(p => ({...p, frontTires: 'mauvais'}))} /> Mauvais</label>
                  </p>
                  <p className="mt-1">Pneu arrières : 
                    <label className="ms-2"><input type="checkbox" checked={inspection.rearTires === 'bon'} onChange={() => setInspection(p => ({...p, rearTires: 'bon'}))} /> Bon</label>
                    <label className="ms-2"><input type="checkbox" checked={inspection.rearTires === 'moyen'} onChange={() => setInspection(p => ({...p, rearTires: 'moyen'}))} /> Moyen</label>
                    <label className="ms-2"><input type="checkbox" checked={inspection.rearTires === 'mauvais'} onChange={() => setInspection(p => ({...p, rearTires: 'mauvais'}))} /> Mauvais</label>
                  </p>
                </div>
                <div>
                  <p>Outillage (cric, etc.) : 
                    <label className="ms-2"><input type="checkbox" checked={inspection.tools} onChange={() => setInspection(p => ({...p, tools: !p.tools}))} /> OUI</label>
                    <label className="ms-2"><input type="checkbox" checked={!inspection.tools} onChange={() => setInspection(p => ({...p, tools: !p.tools}))} /> NON</label>
                  </p>
                  <p className="mt-1">Roue de secours : 
                    <label className="ms-2"><input type="checkbox" checked={inspection.spareTire} onChange={() => setInspection(p => ({...p, spareTire: !p.spareTire}))} /> OUI</label>
                    <label className="ms-2"><input type="checkbox" checked={!inspection.spareTire} onChange={() => setInspection(p => ({...p, spareTire: !p.spareTire}))} /> NON</label>
                  </p>
                </div>
              </div>
              <p className="mt-2">État intérieur : <span className="border-b border-dotted border-black inline-block w-96">_______________________________</span></p>
              <p className="mt-1">Accessoires : <span className="border-b border-dotted border-black inline-block w-full">_______________________________</span></p>
              <p className="mt-1">Autres observations : <span className="border-b border-dotted border-black inline-block w-full">_______________________________</span></p>
            </div>
            
            {/* Pricing */}
            <div className="mt-4 border border-black p-2">
              <p className="font-bold text-sm mb-2">TARIFICATION</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <p>Tarif journalier : <span className="font-bold">{vehicle?.daily_rate || '____'} DZD</span></p>
                <p>Caution : <span className="border-b border-dotted border-black inline-block w-24">______</span> DZD</p>
                <p>Total estimé : <span className="font-bold">{contract ? ((new Date(contract.end_date) - new Date(contract.start_date)) / (1000 * 60 * 60 * 24) * (vehicle?.daily_rate || 0)).toFixed(0) : '____'} DZD</span></p>
              </div>
            </div>
            
            {/* Terms Notice */}
            <div className="mt-4 border border-black p-2 bg-slate-50">
              <p className="text-center font-bold text-sm">SOUBASSEMENT ET MÉCANIQUE SOUS RÉSERVE D'EXPERTISE</p>
            </div>
            
            {/* Signatures */}
            <div className="mt-4 border border-black">
              <div className="grid grid-cols-3">
                <div className="border-e border-black p-4 text-center">
                  <p className="font-bold text-sm">DATE :</p>
                  <p className="mt-2 text-sm">Le {formatDate(today)}</p>
                  <p className="text-sm">À <span className="border-b border-dotted border-black inline-block w-24">_______</span></p>
                </div>
                <div className="border-e border-black p-4 text-center">
                  <p className="font-bold text-sm">Nom et signature client :</p>
                  <div className="h-20 mt-2 flex items-center justify-center">
                    {signatures.client ? (
                      <img src={signatures.client} alt="Signature client" className="max-h-16" />
                    ) : (
                      <span className="text-slate-400 text-xs">Signature client</span>
                    )}
                  </div>
                </div>
                <div className="p-4 text-center">
                  <p className="font-bold text-sm">Nom et signature du réceptionnaire :</p>
                  <div className="h-20 mt-2 flex items-center justify-center">
                    {signatures.agent ? (
                      <img src={signatures.agent} alt="Signature agent" className="max-h-16" />
                    ) : (
                      <span className="text-slate-400 text-xs">Signature agent</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contract Number */}
            <div className="mt-2 text-center text-xs text-slate-500">
              <p>Contrat N° : {contract?.id?.substring(0, 8).toUpperCase() || 'NOUVEAU'} - Généré par LocaTrack</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:max-w-none { max-width: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ContractPrintPage;
