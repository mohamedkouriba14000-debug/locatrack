import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Settings, Key, Satellite, CheckCircle, AlertTriangle, ExternalLink, Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { formatApiError } from '../utils/errorHandler';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const { getAuthHeaders, user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [gpsSettings, setGpsSettings] = useState({
    gps_api_key: '',
    gps_api_url: 'https://tracking.gps-14.net/api/api.php',
    is_configured: false
  });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/gps`, { headers: getAuthHeaders() });
      setGpsSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/settings/gps?gps_api_key=${encodeURIComponent(gpsSettings.gps_api_key)}&gps_api_url=${encodeURIComponent(gpsSettings.gps_api_url)}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success(language === 'fr' ? 'Paramètres GPS enregistrés' : 'تم حفظ إعدادات GPS');
      setGpsSettings(prev => ({ ...prev, is_configured: true }));
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };
  
  const testConnection = async () => {
    if (!gpsSettings.gps_api_key) {
      toast.error(language === 'fr' ? 'Veuillez entrer une clé API' : 'يرجى إدخال مفتاح API');
      return;
    }
    
    setSaving(true);
    try {
      // First save the settings
      await axios.put(
        `${API}/settings/gps?gps_api_key=${encodeURIComponent(gpsSettings.gps_api_key)}&gps_api_url=${encodeURIComponent(gpsSettings.gps_api_url)}`,
        {},
        { headers: getAuthHeaders() }
      );
      
      // Then test the connection
      const response = await axios.get(`${API}/gps/objects`, { headers: getAuthHeaders() });
      
      if (response.data && response.data.length >= 0) {
        toast.success(
          language === 'fr' 
            ? `Connexion réussie ! ${response.data.length} traceur(s) trouvé(s)` 
            : `تم الاتصال بنجاح! تم العثور على ${response.data.length} جهاز(أجهزة) تتبع`
        );
        setGpsSettings(prev => ({ ...prev, is_configured: true }));
      }
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }
  
  // Only locateur can access settings
  if (user?.role !== 'locateur') {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle size={48} className="mx-auto text-orange-500 mb-4" />
          <p className="text-slate-600">
            {language === 'fr' ? 'Seul le locateur peut accéder aux paramètres' : 'يمكن للمؤجر فقط الوصول إلى الإعدادات'}
          </p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900">
            ⚙️ {language === 'fr' ? 'Paramètres' : 'الإعدادات'}
          </h1>
          <p className="text-slate-500 mt-2">
            {language === 'fr' ? 'Configurez votre compte et vos intégrations' : 'قم بتكوين حسابك وعمليات الدمج'}
          </p>
        </div>
        
        {/* GPS Configuration Card */}
        <Card className="bg-white border-2 border-slate-200 shadow-lg mb-6">
          <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="flex items-center gap-3 text-cyan-700">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                <Satellite className="text-white" size={24} />
              </div>
              {language === 'fr' ? 'Configuration API GPS' : 'إعدادات API GPS'}
            </CardTitle>
            <CardDescription>
              {language === 'fr' 
                ? 'Connectez votre compte GPS pour suivre vos véhicules en temps réel' 
                : 'اربط حسابك GPS لتتبع مركباتك في الوقت الفعلي'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-lg border-2 ${gpsSettings.is_configured ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex items-center gap-3">
                {gpsSettings.is_configured ? (
                  <>
                    <CheckCircle className="text-green-500" size={24} />
                    <div>
                      <p className="font-semibold text-green-700">
                        {language === 'fr' ? 'GPS Configuré' : 'تم تكوين GPS'}
                      </p>
                      <p className="text-sm text-green-600">
                        {language === 'fr' ? 'Votre compte GPS est connecté' : 'حساب GPS الخاص بك متصل'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="text-orange-500" size={24} />
                    <div>
                      <p className="font-semibold text-orange-700">
                        {language === 'fr' ? 'GPS Non Configuré' : 'GPS غير مكوّن'}
                      </p>
                      <p className="text-sm text-orange-600">
                        {language === 'fr' ? 'Entrez votre clé API pour activer le suivi GPS' : 'أدخل مفتاح API الخاص بك لتفعيل تتبع GPS'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* API URL */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">
                {language === 'fr' ? 'URL du Serveur GPS' : 'عنوان خادم GPS'}
              </Label>
              <Input
                value={gpsSettings.gps_api_url}
                onChange={(e) => setGpsSettings({ ...gpsSettings, gps_api_url: e.target.value })}
                placeholder="https://tracking.gps-14.net/api/api.php"
                className="bg-white border-2 border-slate-300 focus:border-cyan-500"
              />
              <p className="text-xs text-slate-500">
                {language === 'fr' ? 'Laissez par défaut pour tracking.gps-14.net' : 'اتركه افتراضيًا لـ tracking.gps-14.net'}
              </p>
            </div>
            
            {/* API Key */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <Key size={16} />
                {language === 'fr' ? 'Clé API GPS' : 'مفتاح API GPS'}
              </Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={gpsSettings.gps_api_key}
                  onChange={(e) => setGpsSettings({ ...gpsSettings, gps_api_key: e.target.value })}
                  placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  className="bg-white border-2 border-slate-300 focus:border-cyan-500 pe-12 font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'fr' 
                  ? 'Trouvez votre clé API dans les paramètres de votre compte GPS (CPanel)' 
                  : 'ابحث عن مفتاح API الخاص بك في إعدادات حساب GPS (CPanel)'}
              </p>
            </div>
            
            {/* Help Link */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">
                {language === 'fr' 
                  ? '💡 Comment obtenir votre clé API ?' 
                  : '💡 كيف تحصل على مفتاح API الخاص بك؟'}
              </p>
              <ol className="text-sm text-slate-500 list-decimal list-inside space-y-1">
                <li>{language === 'fr' ? 'Connectez-vous à votre compte GPS' : 'سجل الدخول إلى حساب GPS الخاص بك'}</li>
                <li>{language === 'fr' ? 'Allez dans Paramètres > API' : 'انتقل إلى الإعدادات > API'}</li>
                <li>{language === 'fr' ? 'Copiez votre clé API' : 'انسخ مفتاح API الخاص بك'}</li>
              </ol>
              <a 
                href="https://tracking.gps-14.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700 mt-2"
              >
                <ExternalLink size={14} />
                {language === 'fr' ? 'Accéder à tracking.gps-14.net' : 'الوصول إلى tracking.gps-14.net'}
              </a>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={testConnection}
                disabled={saving || !gpsSettings.gps_api_key}
                variant="outline"
                className="flex-1 border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-500 border-t-transparent"></div>
                    {language === 'fr' ? 'Test en cours...' : 'جاري الاختبار...'}
                  </span>
                ) : (
                  <>
                    <Satellite size={18} className="me-2" />
                    {language === 'fr' ? 'Tester la connexion' : 'اختبار الاتصال'}
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !gpsSettings.gps_api_key}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
              >
                <Save size={18} className="me-2" />
                {language === 'fr' ? 'Enregistrer' : 'حفظ'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Info Card */}
        <Card className="bg-white border-2 border-slate-200 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-3 text-slate-700">
              <Settings size={24} />
              {language === 'fr' ? 'Informations du compte' : 'معلومات الحساب'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-500 text-sm">{language === 'fr' ? 'Entreprise' : 'الشركة'}</Label>
                <p className="font-semibold text-slate-800">{user?.company_name || '-'}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-sm">Email</Label>
                <p className="font-semibold text-slate-800">{user?.email || '-'}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-sm">{language === 'fr' ? 'Nom' : 'الاسم'}</Label>
                <p className="font-semibold text-slate-800">{user?.full_name || '-'}</p>
              </div>
              <div>
                <Label className="text-slate-500 text-sm">{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label>
                <p className="font-semibold text-slate-800">{user?.phone || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;
